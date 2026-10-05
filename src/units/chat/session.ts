import { idb, listen } from "@root/persist";
import { Chat, ChatContents, ChatMessage } from "@root/types";
import { toast } from "@units/toasts";
import { activeJob } from "./generation";

/*
The chat that is currently open, held in memory and written through to idb.

There is exactly one copy of the chat while it is open: views render the same
message objects the session holds, operations below mutate them in place, and
`commit*` writes the records back. Nothing here touches the DOM.
*/

export type ChatSession = {
	chat: Chat,
	contents: ChatContents
};

type SessionListener = (session: ChatSession | null) => void;

let current: ChatSession | null = null;
const replacedListeners: SessionListener[] = [];
const commitListeners: SessionListener[] = [];

/** Fires when the session object itself changes: opened, closed or reloaded from idb */
export function onSessionReplaced(listener: SessionListener) {
	replacedListeners.push(listener);
}
/** Fires after any successful write of the session to idb */
export function onSessionCommit(listener: SessionListener) {
	commitListeners.push(listener);
}

export function getSession() {
	return current;
}

export async function openSession(chatId: string | null): Promise<ChatSession | null> {
	current = chatId ? await load(chatId) : null;
	replacedListeners.forEach(l => l(current));
	return current;
}

async function load(chatId: string): Promise<ChatSession | null> {
	const [chat, contents] = await Promise.all([
		idb.get("chats", chatId),
		idb.get("chatContents", chatId)
	]);
	if (!chat.success || !contents.success) return null;
	if (!chat.value || !contents.value) return null;

	healSwipeIndexes(contents.value.messages);
	return { chat: chat.value, contents: contents.value };
}

// another tab changed a chat record: pick it up unless we are mid-generation
listen(update => {
	if (update.storage !== "idb" || !update.remote || !current) return;
	if (update.store !== "chats" && update.store !== "chatContents") return;
	if (activeJob()) return;
	openSession(current.chat.id);
});

// write-through

/** Saves both records and bumps `lastUpdate`, for changes that count as chat activity */
export async function commit(session: ChatSession) {
	session.chat.lastUpdate = Date.now();
	session.chat.messageCount = session.contents.messages.length;
	return await write(session, true, true);
}
/** Saves messages only, without touching `lastUpdate` (swipe picks, edits, summaries) */
export async function commitContents(session: ChatSession) {
	return await write(session, false, true);
}
/** Saves chat metadata only (definition edits, rEmber settings) */
export async function commitChat(session: ChatSession) {
	return await write(session, true, false);
}

async function write(session: ChatSession, chat: boolean, contents: boolean) {
	const results = await Promise.all([
		chat     ? idb.set("chats", session.chat)            : null,
		contents ? idb.set("chatContents", session.contents) : null
	]);
	const ok = results.every(r => r === null || r.success);
	if (!ok) {
		toast("failed to save chat");
		return false;
	}

	// a generation that outlived a route change commits the object it started with;
	// that object is the truth now, so it replaces whatever was reloaded meanwhile
	if (current && current !== session && current.chat.id === session.chat.id) {
		current = session;
		replacedListeners.forEach(l => l(current));
	}
	commitListeners.forEach(l => l(session));
	return true;
}

// operations: mutate in place, caller commits

export function messageByID(session: ChatSession, mid: number) {
	return session.contents.messages.find(m => m.id === mid) ?? null;
}
export function lastMessage(session: ChatSession) {
	return session.contents.messages.at(-1) ?? null;
}
/** The reply that can still be rerolled or swiped: the last model turn, whatever follows it */
export function lastModelMessage(session: ChatSession) {
	return session.contents.messages.findLast(m => m.from === "model") ?? null;
}
export function selectedText(message: ChatMessage) {
	return message.swipes[message.selectedSwipe] ?? message.swipes[0] ?? "";
}

const NAMES_BY_ROLE = {
	system: "OOC"
};
export function addMessage(session: ChatSession, from: ChatMessage["from"], text: string): ChatMessage {
	const messages = session.contents.messages;
	const names: Record<ChatMessage["from"], string> = {
		user: session.chat.userPersona.name,
		model: session.chat.scenario.name,
		system: NAMES_BY_ROLE.system
	};
	const message: ChatMessage = {
		id: messages.reduce((max, m) => Math.max(max, m.id), -1) + 1,
		from,
		name: names[from],
		rember: null,
		selectedSwipe: 0,
		swipes: [text]
	};
	messages.push(message);
	return message;
}

/** Removes a single message, keeping everything after it. Only OOC notes can go on their own. */
export function removeMessage(session: ChatSession, mid: number) {
	const messages = session.contents.messages;
	const index = messages.findIndex(m => m.id === mid);
	if (index < 0 || messages[index].from !== "system") return false;
	messages.splice(index, 1);
	return true;
}

/** Appends a new swipe and selects it. Blank swipes left by aborted generations are dropped first. */
export function pushSwipe(session: ChatSession, mid: number, text: string, reasoning?: string) {
	const message = messageByID(session, mid);
	if (!message) return null;

	message.swipes = message.swipes.filter(s => s.trim());
	message.swipes.push(text);
	message.selectedSwipe = message.swipes.length - 1;
	if (reasoning) {
		if (!message.reasoningBoxes) message.reasoningBoxes = [];
		message.reasoningBoxes[message.selectedSwipe] = reasoning;
	}
	return message;
}

export function setSwipeText(session: ChatSession, mid: number, swipe: number, text: string) {
	const message = messageByID(session, mid);
	if (!message || typeof message.swipes[swipe] !== "string") return false;
	message.swipes[swipe] = text;
	return true;
}

export function selectSwipe(session: ChatSession, mid: number, swipe: number) {
	const message = messageByID(session, mid);
	if (!message) return false;
	if (typeof message.swipes[swipe] !== "string") {
		toast(`error: setting six ${swipe} on mid ${mid}, but only ${message.swipes.length} swipes are present`);
		return false;
	}
	message.selectedSwipe = swipe;
	return true;
}

export function setRember(session: ChatSession, mid: number, value: string | null) {
	const message = messageByID(session, mid);
	if (!message) return false;
	message.rember = value;
	return true;
}

/** Removes the message and everything after it. Returns the ids removed. */
export function truncateFrom(session: ChatSession, mid: number) {
	const messages = session.contents.messages;
	const index = messages.findIndex(m => m.id === mid);
	if (index < 0) return [];
	return messages.splice(index).map(m => m.id);
}

// HACK: heal swipe indexes broken by older versions and imports
function healSwipeIndexes(messages: ChatMessage[]) {
	messages.forEach(m => {
		if (typeof m.swipes[m.selectedSwipe] !== "string") {
			toast(`healed malformed message: mid ${m.id}, old six: ${m.selectedSwipe}`);
			m.selectedSwipe = 0;
		}
	});
}
