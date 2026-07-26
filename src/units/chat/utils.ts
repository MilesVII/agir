import { RampikeTabs } from "@rampike/tabs";
import { getBlobLink, idb } from "@root/persist";
import { runProvider } from "@root/run";
import { Chat, ChatMessage } from "@root/types";
import { readProviders } from "@units/settings/providers";
import { RampikeMessageView } from "./views";
import { loadMiscSettings } from "@units/settings/misc";
import { toast } from "@units/toasts";
import { updateRemberCounter } from "./rember";
import { chatStore, messagesStore } from "@units/caching";

export async function setSwipe(chatId: string, messageId: number, swipeIx: number, value: string) {
	await messagesStore.write(async old => {
		if (!old || old.id !== chatId) return old;

		const tix = old.messages.findIndex(m => m.id === messageId);
		if (tix < 0) return old;
	
		old.messages[tix].swipes[swipeIx] = value;
		return old;
	});
}

export async function pushSwipe(chatId: string, messageId: number, value: string, reasoning?: string) {
	let result: ChatMessage | null = null;
	await messagesStore.write(async old => {
		if (!old || old.id !== chatId) {
			toast("failed to push swipe: chat id mismatch")
			return old;
		}

		const mix = old.messages.findIndex(m => m.id === messageId);
		if (mix < 0) return old;
		
		old.messages[mix].swipes = old.messages[mix].swipes.filter(m => m.trim());
		old.messages[mix].swipes.push(value);
		const six = old.messages[mix].swipes.length - 1;
		old.messages[mix].selectedSwipe = six;
		if (reasoning) {
			if (!old.messages[mix].reasoningBoxes) old.messages[mix].reasoningBoxes = [];
			old.messages[mix].reasoningBoxes[six] = reasoning;
		}

		chatStore.write(async chat => {
			if (!chat || chat.id !== chatId) return chat;
			chat.lastUpdate = Date.now();
			return chat;
		});
		result = old.messages[mix];

		return old;
	})

	return result;
}

export async function addMessage(chatId: string, value: string, fromUser: boolean, name: string): Promise<ChatMessage | null> {
	let result: ChatMessage | null = null;

	await messagesStore.write(async old => {
		if (!old || old.id !== chatId) return old;

		const newMessage: ChatMessage = {
			from: fromUser ? "user" : "model",
			id: old.messages.length,
			name: name,
			rember: null,
			selectedSwipe: 0,
			swipes: [value]
		};
		old.messages.push(newMessage);
	
		chatStore.write(async chat => {
			if (!chat || chat.id !== chatId) return chat;

			chat.lastUpdate = Date.now();
			chat.messageCount = old.messages.length;
			return chat;
		})
	
		// HACK: heal bugged swipeIndesex
		old.messages.forEach(m => {
			if (typeof m.swipes[m.selectedSwipe] !== "string") {
				toast(`healed malformed message: mid ${m.id}, old six: ${m.selectedSwipe}`);
				m.selectedSwipe = 0;
			}
		});

		result = newMessage;
		return old;
	});

	return result;
}

export async function updateSwipeIndex(six: number, mid: number, chatId: string) {
	await messagesStore.write(async old => {
		if (!old || old.id !== chatId) return old;

		const mix = old.messages.findIndex(m => m.id === mid);
		if (typeof old.messages[mix].swipes[six] !== "string") {
			toast(`error: setting six ${six} on mid ${mid}, but only ${old.messages[mix].swipes.length} swipes are present`);
			return old;
		}
		old.messages[mix].selectedSwipe = six;

		return old;
	});
}
export async function updateRember(value: string | null, mid: number, chatId: string) {
	await messagesStore.write(async old => {
		if (!old || old.id !== chatId) return old;

		const mix = old.messages.findIndex(m => m.id === mid);
		old.messages[mix].rember = value;

		return old;
	});
}

export async function deleteMessage(chatId: string, messageId: number) {
	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;
	if (inputModes.tab !== "main") return;

	if (!confirm("all the following messages will be deleted too")) return;

	messagesStore.write(async old => {
		if (!old || old.id !== chatId) return old;

		const mix = old.messages.findIndex(m => m.id === messageId);
		if (mix < 0) return old;
	
		old.messages.splice(mix);
		chatStore.write(async chat => {
			if (!chat || chat.id !== chatId) return chat;

			chat.lastUpdate = Date.now();
			chat.messageCount = old.messages.length;

			return chat;
		});

		return old;
	})

	const messageViews = document.querySelectorAll<RampikeMessageView>(".message[data-mid]");
	messageViews.forEach(m => {
		const mid = parseInt(m.dataset.mid!, 10);
		if (mid >= messageId) m.remove();
		if (mid === messageId - 1) m.controls.setIsLast(true);
	});
	updateRemberCounter();
}

export async function reroll(chatId: string, messageId: number) {
	const payload = await prepareRerollPayload(chatId, messageId);
	if (!payload) return;
	loadResponse(payload, messageId, chatId);
}

export async function preparePayload(contents: ChatMessage[], systemPrompt: string, userMessage: string) {
	const settings = loadMiscSettings();
	const sliced = settings.tail === 0 ? contents : contents.slice(-settings.tail);

	const system: ChatMessage = dullMessage("system", systemPrompt);
	const payload: ChatMessage[] = [
		system,
		...sliced
	];
	if (!userMessage) return payload;

	const user: ChatMessage = dullMessage("user", userMessage);
	payload.push(user);
	return payload;
}

export async function prepareRerollPayload(chatId: string, messageId: number) {
	const chat = await chatStore.read();
	if (!chat) return;
	const messages = await messagesStore.read();
	if (!messages) return;
	if (chat.id !== chatId || messages.id !== chatId) return;

	const mix = messages.messages.findIndex(m => m.id === messageId);
	if (mix < 0) return null;

	const history = messages.messages.slice(0, mix);

	const settings = loadMiscSettings();
	const sliced = settings.tail === 0 ? history : history.slice(-settings.tail);

	const system: ChatMessage = dullMessage("system", chat.scenario.definition);
	const payload: ChatMessage[] = [
		system,
		...sliced
	];

	return payload;
}

export async function loadResponse(payload: ChatMessage[], msgId: number, chatId: string) {
	const providerOptions = Object.entries(readProviders());
	if (providerOptions.length <= 0) {
		toast("no providers found");
		return;
	}
	const [, provider] = providerOptions.find(([, e]) => e.isActive) ?? providerOptions[0];

	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;
	inputModes.tab = "pending";

	const messageView = getMessageViewByID(msgId);
	if (!messageView) {
		window.location.reload();
		return;
	}
	const responseStreamingUpdater = messageView.controls.startStreaming();
	const responseReasoningStatusReporter = messageView.controls.reasoningStatus;
	let reasoning = "";
	const responseReasoningReporter = (chunk: string) => {
		reasoning += chunk;
		messageView.controls.addReasoningChunk(chunk);
	}

	const streamingResult = await runProvider(
		expandRember(payload),
		provider,
		responseStreamingUpdater,
		true,
		responseReasoningStatusReporter,
		responseReasoningReporter
	);
	if (streamingResult.success) {
		const updatedMessage = await pushSwipe(chatId, msgId, streamingResult.value, reasoning);
		if (!updatedMessage) {
			toast("failed to save response message");
			return;
		}
		messageView.controls.updateMessage(updatedMessage);
	} else {
		toast(streamingResult.error);
	}

	messageView.controls.endStreaming();
	inputModes.tab = "main";
}

export async function loadPictures(chat: Chat) {
	return await Promise.all([
		chat.userPersona.picture && getBlobLink(chat.userPersona.picture),
		chat.scenario.picture    && getBlobLink(chat.scenario.picture)
	]);
}

export function getMessageViewByID(messageId: number) {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	return list.querySelector<RampikeMessageView>(`.message[data-mid="${messageId}"]`);
}

export function dullMessage(from: ChatMessage["from"], text: string): ChatMessage {
	return { from, id: -1, name: "", rember: null, swipes: [text], selectedSwipe: 0 };
}

export function expandRember(chat: ChatMessage[]) {
	const remberAt = chat.findLastIndex(m => m.rember);
	if (remberAt === -1) {
		return chat;
	} else {
		return chat.slice(0, remberAt + 1)
			.concat(
				dullMessage("system", `# Roleplay state summary:\n${chat[remberAt].rember!}`),
				chat.slice(remberAt + 1)
			);
	}
}
