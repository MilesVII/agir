import { getBlobLink } from "@root/persist";
import { Chat, Provider } from "@root/types";
import { loadMiscSettings } from "@units/settings/misc";
import { readProviders } from "@units/settings/providers";
import { toast } from "@units/toasts";
import { activeJob, runJob } from "./generation";
import { roleplayPrompt } from "./prompt";
import {
	ChatSession, addMessage, commit, commitContents, getSession,
	lastMessage, messageByID, pushSwipe, selectSwipe, setSwipeText, truncateFrom
} from "./session";
import { makeMessageView, MessageView, Pictures } from "@views/message";

/*
The message list: renders the session, routes `message:*` events from the views
to session operations, and drives roleplay generation.
*/

const BUSY_TOAST = "please wait until message generation is over";

function listElement() {
	return document.querySelector<HTMLDivElement>("#play-messages")!;
}

export function initMessageList() {
	const list = listElement();

	list.addEventListener("message:swipe", ({ detail }) => {
		const session = getSession();
		if (!session) return;
		if (selectSwipe(session, detail.mid, detail.swipe)) commitContents(session);
		getMessageView(session.chat.id, detail.mid)?.controls.refresh();
	});
	list.addEventListener("message:edit", ({ detail }) => {
		const session = getSession();
		if (!session) return;
		if (setSwipeText(session, detail.mid, detail.swipe, detail.text)) commitContents(session);
		getMessageView(session.chat.id, detail.mid)?.controls.refresh();
	});
	list.addEventListener("message:reroll", ({ detail }) => generate(detail.mid));
	list.addEventListener("message:delete", ({ detail }) => deleteFrom(detail.mid));
}

export async function renderMessages(session: ChatSession | null) {
	const list = listElement();
	list.innerHTML = "";
	delete list.dataset.chat;
	if (!session) return;

	const pictures = await loadPictures(session.chat);
	if (getSession() !== session) return; // route moved on while pictures were loading

	const messages = session.contents.messages;
	list.dataset.chat = session.chat.id;
	list.append(...messages.map((m, ix) => makeMessageView(m, pictures, ix === messages.length - 1, getBlobLink)));
	list.scrollTop = list.scrollHeight;
}

/** Looks a view up by message id, but only while the list shows that chat */
export function getMessageView(chatId: string, mid: number) {
	const list = listElement();
	if (list.dataset.chat !== chatId) return null;
	return list.querySelector<MessageView>(`.message[data-mid="${mid}"]`);
}

/** Stores the user message and an empty reply, then starts generating the reply. Resolves once both are saved. */
export async function sendMessage(text: string) {
	const session = getSession();
	if (!session) return false;
	if (activeJob()) {
		toast(BUSY_TOAST);
		return false;
	}

	const previous = lastMessage(session);
	const request = addMessage(session, "user", text);
	const reply   = addMessage(session, "model", "");
	if (!await commit(session)) return false;

	const pictures = await loadPictures(session.chat);
	const list = listElement();
	if (previous) getMessageView(session.chat.id, previous.id)?.controls.setIsLast(false);
	list.append(
		makeMessageView(request, pictures, false, getBlobLink),
		makeMessageView(reply,   pictures, true,  getBlobLink)
	);
	list.scrollTop = list.scrollHeight;

	generate(reply.id);
	return true;
}

/** Generates a new swipe for a model message from everything before it */
async function generate(mid: number) {
	const session = getSession();
	if (!session) return;
	if (activeJob()) {
		toast(BUSY_TOAST);
		return;
	}
	const provider = mainProvider();
	if (!provider) {
		toast("no providers found");
		return;
	}
	const message = messageByID(session, mid);
	if (!message || message.from !== "model") return;
	const view = getMessageView(session.chat.id, mid);
	if (!view) return;

	const chatId = session.chat.id;
	const settings = loadMiscSettings();
	const prompt = roleplayPrompt(session, mid, {
		tail: settings.tail,
		remberStretch: settings.remberStretch,
		suffix: provider.suffix
	});

	// views are looked up per chunk: the list may be re-rendered mid-stream
	view.controls.startStreaming();
	let reasoning = "";
	const result = await runJob("roleplay", provider, prompt, {
		onChunk: chunk => getMessageView(chatId, mid)?.controls.appendChunk(chunk),
		onReasoningChunk: chunk => {
			reasoning += chunk;
			getMessageView(chatId, mid)?.controls.addReasoningChunk(chunk);
		},
		onReasoningStatus: on => getMessageView(chatId, mid)?.controls.reasoningStatus(on)
	});

	if (result.success) {
		pushSwipe(session, mid, result.value, reasoning);
		await commit(session);
	} else {
		toast(result.error);
	}
	getMessageView(chatId, mid)?.controls.endStreaming();
}

async function deleteFrom(mid: number) {
	const session = getSession();
	if (!session) return;
	if (activeJob()) {
		toast(BUSY_TOAST);
		return;
	}
	if (!confirm("all the following messages will be deleted too")) return;

	const removed = truncateFrom(session, mid);
	if (removed.length === 0) return;
	await commit(session);

	removed.forEach(id => getMessageView(session.chat.id, id)?.remove());
	const last = lastMessage(session);
	if (last) getMessageView(session.chat.id, last.id)?.controls.setIsLast(true);
}

async function loadPictures(chat: Chat): Promise<Pictures> {
	const [user, model] = await Promise.all([
		chat.userPersona.picture ? getBlobLink(chat.userPersona.picture) : null,
		chat.scenario.picture    ? getBlobLink(chat.scenario.picture)    : null
	]);
	return [user, model];
}

function mainProvider(): Provider | null {
	const providers = Object.values(readProviders());
	return providers.find(p => p.isActive) ?? providers[0] ?? null;
}
