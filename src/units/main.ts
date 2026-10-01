import { RampikeFilePicker } from "@rampike/filepicker";
import { b64Encoder, nothrow, unique } from "@root/utils";
import { Chat, ChatContents, Folder } from "@root/types";
import { getBlobLink, idb, listen } from "@root/persist";
import { mudcrack } from "rampike";
import { cheatHandler } from "./cheats";
import { placeholderView } from "@views/common";
import { makeChatHandleView, messagesCaption } from "@views/chat-handle";


export function mainUnit() {
	const importButton = document.querySelector<RampikeFilePicker>("#main-import")!;
	const chatCounter = document.querySelector<HTMLElement>("#main-counter")!;

	importButton.addEventListener("input", () => {
		const file = importButton.input.files?.[0];
		if (!file) return;

		importChat(file);
	});
	chatCounter.addEventListener("click", cheatHandler)

	listen(u => {
		if (u.storage !== "idb") return;
		if (u.store !== "chats") return;

		update(null);
	});
	update(null);
}

async function update(folder: Folder) {
	const chatCounter = document.querySelector<HTMLElement>("#main-counter")!;

	const handles = await idb.getAll("chats");
	if (!handles.success) return;

	const cc = handles.value.length;
	const singular = cc === 1 || ((cc % 10 === 1) && (cc % 100 !== 11));
	chatCounter.textContent = `${handles.value.length} ${singular ? "chat" : "chats"}`;

	const folderOptions = unique(handles.value.map(c => c.folder).filter(f => f) as string[]);

	updateChatHandles(handles.value, folder, folderOptions);
	updateFolders(folder, folderOptions, update);
}

function updateChatHandles(handles: Chat[], folder: Folder, folderOptions: string[]) {
	const list = document.querySelector("#main-chats")!;

	list.innerHTML = "";

	const filtered = folder ? handles.filter(c => c.folder === folder) : handles;
	const items = filtered.reverse().map(c => handleView(c, folderOptions));

	if (items.length === 0) list.append(placeholderView("No chats found"));
	list.append(...items);
}

function updateFolders(folder: Folder, options: string[], onChange: (folder: Folder) => void) {
	const folders = document.querySelector<HTMLElement>("#main-folders")!;
	folders.innerHTML = "";
	const folderButton = (f: Folder) => mudcrack({
		tagName: "button",
		className: "strip fit pointer",
		events: {
			click: () => {
				updateFolders(f, options, onChange);
				onChange(f);
			}
		},
		attributes: {
			"data-selected": folder === f ? "true" : "not true"
		},
		contents: f || "all chats"
	});
	folders.append(
		folderButton(null),
		...options.map(folderButton)
	);
	// folders.hidden = options.length === 0;
}

function handleView(handle: Chat, folderOptions: string[]) {
	return makeChatHandleView(
		handle,
		{
			scenario: handle.scenario.picture    ? getBlobLink(handle.scenario.picture)    : null,
			user:     handle.userPersona.picture ? getBlobLink(handle.userPersona.picture) : null
		},
		folderOptions,
		{
			play:         () => window.location.hash = `play.${handle.id}`,
			delete:       () => deleteChat(handle.id, handle.scenario.name, handle.messageCount),
			setMemo:      () => setMemo(handle.id, handle.memo),
			assignFolder: folder => assignToFolder(handle.id, folder),
			newFolder:    () => {
				const newName = prompt("Enter the name of the new folder")?.trim();
				if (!newName) return;
				assignToFolder(handle.id, newName);
			}
		}
	);
}

function deleteChat(id: string, name: string, messageCount: number) {
	const confirmed = confirm(`Chat with ${name} (${messagesCaption(messageCount)}) will be deleted`);
	if (!confirmed) return;

	idb.del("chatContents", id);
	idb.del("chats", id);
}
async function assignToFolder(id: string, folder: string | null) {
	const chat = await idb.get("chats", id);
	if (!chat.success) return false;
	chat.value.folder = folder;
	await idb.set("chats", chat.value);
	return true;
}
async function setMemo(id: string, old?: string) {
	const newMemo = prompt("set chat memo", old ?? "");
	if (newMemo === null) return;

	const chat = await idb.get("chats", id);
	if (!chat.success) return false;
	chat.value.memo = newMemo || undefined;
	await idb.set("chats", chat.value);
}

async function importChat(file: File) {
	const json = await file.text();
	const parsed = nothrow(() => JSON.parse(json));
	if (!parsed.success) return;

	const chat     = parsed.value.chat as Chat;
	const contents = parsed.value.contents as ChatContents;
	const media    = parsed.value.media;

	for (const m of media) {
		m.media = await b64Encoder.decode(m.media);
		await idb.set("media", m);
	}

	await idb.set("chats", chat);
	await idb.set("chatContents", contents);
}
