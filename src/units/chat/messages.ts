import { getBlobLink } from "@root/persist";
import { Chat, ChatMessage, Provider } from "@root/types";
import { loadMiscSettings } from "@units/settings/misc";
import { readProviders } from "@units/settings/providers";
import { toast } from "@units/toasts";
import { activeJob, runJob } from "./generation";
import { roleplayPrompt } from "./prompt";
import {
	ChatSession, addMessage, commit, commitContents, getSession, lastModelMessage, messageByID,
	pushSwipe, removeMessage, selectSwipe, selectedText, setRember, setSwipeText, truncateFrom
} from "./session";
import { makeMessageView, MessageView, Pictures } from "@views/message";
import { makeSystemView, SystemView, systemViewKey } from "@views/system-message";

/*
The message list: renders the session, routes `message:*` and `system:*` events from the
views to session operations, and drives roleplay generation.

Three kinds of views live in the list:
- regular messages (user and model turns)
- OOC notes: `system` chat messages, appended without asking for a reply
- rEmber summaries: shown right above the message they are attached to, hidden until toggled
*/

const BUSY_TOAST = "please wait until message generation is over";
const OOC_NAME = "OOC";
const REMBER_NAME = "rEmber";
const REMBER_ICON = "assets/gfx/rember.png";

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
	list.addEventListener("message:rember", ({ detail }) => {
		const session = getSession();
		if (!session) return;
		getSystemView(session.chat.id, detail.mid, true)?.controls.toggle();
	});

	list.addEventListener("system:edit", ({ detail }) => {
		const session = getSession();
		if (!session) return;
		const changed = detail.rember
			? setRember(session, detail.mid, detail.text)
			: setNoteText(session, detail.mid, detail.text);
		if (changed) commitContents(session);
		getSystemView(session.chat.id, detail.mid, detail.rember)?.controls.refresh();
	});
	list.addEventListener("system:delete", ({ detail }) => {
		if (detail.rember) deleteRember(detail.mid);
		else deleteNote(detail.mid);
	});
}

export async function renderMessages(session: ChatSession | null) {
	const list = listElement();
	list.innerHTML = "";
	delete list.dataset.chat;
	if (!session) return;

	const pictures = await loadPictures(session.chat);
	if (getSession() !== session) return; // route moved on while pictures were loading

	const last = lastModelMessage(session);
	list.dataset.chat = session.chat.id;
	list.append(...session.contents.messages.flatMap(m => [
		...(m.rember ? [remberView(m, true)] : []),
		m.from === "system"
			? noteView(m)
			: makeMessageView(m, pictures, m === last)
	]));
	list.scrollTop = list.scrollHeight;
}

function remberView(message: ChatMessage, hidden: boolean) {
	return makeSystemView({
		mid: message.id,
		rember: true,
		name: REMBER_NAME,
		icon: REMBER_ICON,
		read: () => message.rember ?? "",
		hidden
	});
}
function noteView(message: ChatMessage) {
	return makeSystemView({
		mid: message.id,
		rember: false,
		name: message.name || OOC_NAME,
		icon: null,
		read: () => selectedText(message)
	});
}

/** Looks a regular message view up by id, but only while the list shows that chat */
export function getMessageView(chatId: string, mid: number) {
	const list = listElement();
	if (list.dataset.chat !== chatId) return null;
	return list.querySelector<MessageView>(`.message:not(.system-message)[data-mid="${mid}"]`);
}
/** Looks an OOC note view (by its id) or a rEmber view (by the id of the message it belongs to) up */
export function getSystemView(chatId: string, mid: number, rember: boolean) {
	const list = listElement();
	if (list.dataset.chat !== chatId) return null;
	return list.querySelector<SystemView>(`.system-message[data-mid="${systemViewKey(mid, rember)}"]`);
}

/** Shows the rEmber view above message `mid`, creating it if the message has no summary yet */
export function ensureRemberView(chatId: string, mid: number) {
	const session = getSession();
	const message = session && messageByID(session, mid);
	if (!session || session.chat.id !== chatId || !message) return null;

	const existing = getSystemView(chatId, mid, true);
	if (existing) {
		existing.controls.show();
		return existing;
	}
	const anchor = getMessageView(chatId, mid);
	if (!anchor) return null;
	const view = remberView(message, false);
	anchor.before(view);
	return view;
}

export function scrollToMessage(chatId: string, mid: number) {
	getMessageView(chatId, mid)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Stores the user message and an empty reply, then starts generating the reply. Resolves once both are saved. */
export async function sendMessage(text: string) {
	const session = getSession();
	if (!session) return false;
	if (activeJob()) {
		toast(BUSY_TOAST);
		return false;
	}

	const previous = lastModelMessage(session);
	const request = addMessage(session, "user", text);
	const reply   = addMessage(session, "model", "");
	if (!await commit(session)) return false;

	const pictures = await loadPictures(session.chat);
	const list = listElement();
	if (previous) getMessageView(session.chat.id, previous.id)?.controls.setIsLast(false);
	list.append(
		makeMessageView(request, pictures, false),
		makeMessageView(reply,   pictures, true)
	);
	list.scrollTop = list.scrollHeight;

	generate(reply.id);
	return true;
}

/** Appends an OOC note to the chat without asking the model for a reply */
export async function appendNote(text: string) {
	const session = getSession();
	if (!session) return false;
	if (activeJob()) {
		toast(BUSY_TOAST);
		return false;
	}

	const note = addMessage(session, "system", text);
	if (!await commit(session)) return false;

	const list = listElement();
	list.append(noteView(note));
	list.scrollTop = list.scrollHeight;
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
		oocAsUser: settings.oocAsUser,
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

/** Deletes a user message and everything after it */
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

	const chatId = session.chat.id;
	removed.forEach(id => {
		getMessageView(chatId, id)?.remove();
		getSystemView(chatId, id, false)?.remove();
		getSystemView(chatId, id, true)?.remove();
	});
	const last = lastModelMessage(session);
	if (last) getMessageView(chatId, last.id)?.controls.setIsLast(true);
}

/** Deletes a single OOC note, the rest of the chat stays */
async function deleteNote(mid: number) {
	const session = getSession();
	if (!session) return;
	if (activeJob()) {
		toast(BUSY_TOAST);
		return;
	}
	if (!confirm("the note will be deleted")) return;

	if (!removeMessage(session, mid)) return;
	await commit(session);
	getSystemView(session.chat.id, mid, false)?.remove();
}

async function deleteRember(mid: number) {
	const session = getSession();
	if (!session) return;
	if (!confirm(`the rEmber summary attached to message #${mid} will be removed`)) return;

	if (setRember(session, mid, null)) await commitContents(session);
	getSystemView(session.chat.id, mid, true)?.remove();
	getMessageView(session.chat.id, mid)?.controls.refresh();
}

function setNoteText(session: ChatSession, mid: number, text: string) {
	const note = messageByID(session, mid);
	if (!note) return false;
	return setSwipeText(session, mid, note.selectedSwipe, text);
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
