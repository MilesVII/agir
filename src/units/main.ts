import { RampikeFilePicker } from "@rampike/filepicker";
import { b64Encoder, nothrow, placeholder, setSelectMenu, unique } from "@root/utils";
import { Chat, ChatContents, Folder } from "@root/types";
import { getBlobLink, idb, listen } from "@root/persist";
import { mudcrack } from "rampike";


export function mainUnit() {
	const importButton = document.querySelector<RampikeFilePicker>("#main-import")!;
	importButton.addEventListener("input", () => {
		const file = importButton.input.files?.[0];
		if (!file) return;

		importChat(file);
	});

	listen(u => {
		if (u.storage !== "idb") return;
		if (u.store !== "chats") return;

		update(null);
	});
	update(null);
}

async function update(folder: Folder) {
	const handles = await idb.getAll("chats");
	if (!handles.success) return;
	const folderOptions = unique(handles.value.map(c => c.folder).filter(f => f) as string[]);

	updateChatHandles(handles.value, folder, folderOptions);
	updateFolders(folder, folderOptions, update);
}

function updateChatHandles(handles: Chat[], folder: Folder, folderOptions: string[]) {
	const list = document.querySelector("#main-chats")!;

	list.innerHTML = "";

	const filtered = folder ? handles.filter(c => c.folder === folder) : handles;
	const items = filtered.reverse().map(c => handleView(c, folderOptions));

	if (items.length === 0) list.append(mudcrack({ className: "placeholder", contents: "No chats found" }));
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
	const play = () => window.location.hash = `play.${handle.id}`;
	const icon = mudcrack({
		tagName: "img",
		className: "pointer",
		attributes: {
			src: placeholder(null)
		},
		events: {
			click: play
		}
	});
	const userIcon = mudcrack({
		tagName: "img",
		attributes: {
			src: placeholder(null)
		}
	});
	const folderSelect = mudcrack({
		tagName: "select",
		className: "lineout center-text pointer"
	});
	if (handle.scenario.picture)
		getBlobLink(handle.scenario.picture).then(src => src && (icon.src = src));
	if (handle.userPersona.picture)
		getBlobLink(handle.userPersona.picture).then(src => src && (userIcon.src = src));

	const newFolder = () => {
		const newName = prompt("Enter the name of the new folder")?.trim();
		if (!newName) return;
		assignToFolder(handle.id, newName)
	}
	setSelectMenu(
		folderSelect,
		handle.folder ?? "-folder-",
		[
			["unassigned", () => assignToFolder(handle.id, null)],
			["new folder", newFolder],
			...folderOptions.map(c =>
				[c, () => assignToFolder(handle.id, c)] as [string, () => void]
			)
		]
	);

	return mudcrack({
		className: "lineout row main-chats-item",
		contents: [
			icon,
			mudcrack({
				className: "list wide",
				contents: [
					mudcrack({
						tagName: "h2",
						className: "pointer",
						contents: handle.scenario.name,
						events: {
							click: play
						}
					}),
					mudcrack({
						className: "row-compact main-chats-item-user",
						contents: [
							userIcon,
							mudcrack({
								contents: handle.userPersona.name
							})
						]
					}),
					mudcrack({
						className: "hint",
						contents: messagesCaption(handle.messageCount),
					})
				]
			}),
			mudcrack({
				className: "list main-chats-item-actions",
				contents: [
					mudcrack({
						tagName: "button",
						className: "lineout",
						contents: "play",
						events: {
							click: play
						}
					}),
					folderSelect,
					mudcrack({
						tagName: "button",
						className: "lineout",
						contents: "delete",
						events: {
							click: () => deleteChat(handle.id, handle.scenario.name, handle.messageCount)
						}
					})
				]
			})
		]
	})
}

function messagesCaption(count: number) {
	return (count % 10 === 1) ? `${count} message` : `${count} messages`;
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
};
