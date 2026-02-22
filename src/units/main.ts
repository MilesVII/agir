import { RampikeFilePicker } from "@rampike/filepicker";
import { b64Encoder, nothrow, placeholder } from "@root/utils";
import { Chat, ChatContents } from "@root/types";
import { getBlobLink, idb, listen } from "@root/persist";
import { mudcrack } from "rampike";

export function mainUnit() {
	const importButton = document.querySelector<RampikeFilePicker>("#main-import")!;
	importButton.addEventListener("input", () => {
		const file = importButton.input.files?.[0];
		if (!file) return;

		importChat(file);
	});

	listen(update => {
		if (update.storage !== "idb") return;
		if (update.store !== "chats") return;

		updateChatHandles();
	});
	updateChatHandles();
}

async function updateChatHandles() {
	const list = document.querySelector("#main-chats")!;
	const handles = await idb.getAll("chats");
	if (!handles.success) return;
	list.innerHTML = "";

	const items = handles.value.reverse().map(handle => {
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
		if (handle.scenario.picture)
			getBlobLink(handle.scenario.picture).then(src => src && (icon.src = src));
		if (handle.userPersona.picture)
			getBlobLink(handle.userPersona.picture).then(src => src && (userIcon.src = src));

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
					className: "list",
					contents: [
						mudcrack({
							tagName: "button",
							className: "lineout",
							contents: "play",
							events: {
								click: play
							}
						}),
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
	});

	if (items.length === 0) list.append(mudcrack({ className: "placeholder", contents: "No chats found" }));
	list.append(...items);
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
