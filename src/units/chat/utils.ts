import { RampikeTabs } from "@rampike/tabs";
import { getBlobLink, idb } from "@root/persist";
import { runEngine } from "@root/run";
import { Chat, ChatMessage } from "@root/types";
import { readEngines } from "@units/settings/engines";
import { RampikeMessageView } from "./message-view";
import { loadMiscSettings } from "@units/settings/misc";

export async function setSwipe(chatId: string, messageId: number, swipeIx: number, value: string) {
	const contents = await idb.get("chatContents", chatId);
	if (!contents.success) return;

	const tix = contents.value.messages.findIndex(m => m.id === messageId);
	if (tix < 0) return;

	contents.value.messages[tix].swipes[swipeIx] = value;
	await idb.set("chatContents", contents.value);
}

export async function pushSwipe(chatId: string, messageId: number, value: string) {
	const [contents, chat] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!contents.success || !chat.success) return null;
	const messages = contents.value.messages;

	const mix = messages.findIndex(m => m.id === messageId);
	if (mix < 0) return;

	messages[mix].swipes = messages[mix].swipes.filter(m => m.trim());
	messages[mix].swipes.push(value);
	messages[mix].selectedSwipe = messages[mix].swipes.length - 1;

	chat.value.lastUpdate = Date.now();
	await Promise.all([
		idb.set("chatContents", contents.value),
		idb.set("chats", chat.value)
	]);

	return messages[mix];
}

export async function addMessage(chatId: string, value: string, fromUser: boolean, name: string) {
	const [contents, chat] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!contents.success || !chat.success) return null;
	const messages = contents.value.messages;

	const newMessage: ChatMessage = {
		from: fromUser ? "user" : "model",
		id: messages.length,
		name: name,
		rember: null,
		selectedSwipe: 0,
		swipes: [value]
	};
	messages.push(newMessage);

	chat.value.lastUpdate = Date.now();
	chat.value.messageCount = messages.length;

	await Promise.all([
		idb.set("chatContents", contents.value),
		idb.set("chats", chat.value)
	]);

	return newMessage;
}

export async function updateSwipeIndex(six: number, mid: number, chatId: string) {
	const contents = await idb.get("chatContents", chatId);
	if (!contents.success) return;
	const mix = contents.value.messages.findIndex(m => m.id === mid);
	contents.value.messages[mix].selectedSwipe = six;
	await idb.set("chatContents", contents.value);
}

export async function deleteMessage(chatId: string, messageId: number) {
	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;
	if (inputModes.tab !== "main") return;

	if (!confirm("all the following messages will be deleted too")) return;

	const [contents, chat] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!contents.success || !chat.success) return;
	const messages = contents.value.messages;

	const mix = messages.findIndex(m => m.id === messageId);
	if (mix < 0) return;

	contents.value.messages.splice(mix);
	chat.value.lastUpdate = Date.now();
	chat.value.messageCount = messages.length;

	await Promise.all([
		idb.set("chatContents", contents.value),
		idb.set("chats", chat.value)
	]);

	const messageViews = document.querySelectorAll<RampikeMessageView>(".message[data-mid]");
	messageViews.forEach(m => {
		const mid = parseInt(m.dataset.mid!, 10);
		if (mid >= messageId) m.remove();
		if (mid === messageId - 1) m.rampike.params.setIsLast(true);
	});
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
	const [contents, chat] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!contents.success || !chat.success) return null;
	
	const messages = contents.value.messages;
	const mix = messages.findIndex(m => m.id === messageId);
	if (mix < 0) return null;

	const history = messages.slice(0, mix);

	const settings = loadMiscSettings();
	const sliced = settings.tail === 0 ? history : history.slice(-settings.tail);

	const system: ChatMessage = dullMessage("system", chat.value.scenario.definition);
	const payload: ChatMessage[] = [
		system,
		...sliced
	];

	return payload;
}

export async function loadResponse(payload: ChatMessage[], msgId: number, chatId: string) {
	const engineOptions = Object.entries(readEngines());
	if (engineOptions.length <= 0) {
		console.error("no engines!");
		return;
	}
	const [, engine] = engineOptions.find(([, e]) => e.isActive) ?? engineOptions[0];

	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;
	inputModes.tab = "pending";

	const messageView = getMessageViewByID(msgId);
	if (!messageView) {
		window.location.reload();
		return;
	}
	const responseMessageControls = messageView.rampike.params;
	const responseStreamingUpdater = responseMessageControls.startStreaming();

	const streamingResult = await runEngine(payload, engine, responseStreamingUpdater);
	if (streamingResult.success) {
		const updatedMessage = await pushSwipe(chatId, msgId, streamingResult.value);
		if (!updatedMessage) {
			console.error("failed to save response message");
			return;
		}
		responseMessageControls.updateMessage(updatedMessage);
	}

	responseMessageControls.endStreaming();
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
