import { RampikeFilePicker } from "@rampike/filepicker";
import { RampikeUnit } from "./types";
import { nothrow, nothrowAsync, placeholder } from "@root/utils";
import { ChatMessage } from "@root/types";
import { getBlobLink, idb, listen } from "@root/persist";
import { mudcrack } from "rampike";

export const mainUnit: RampikeUnit = {
	init: () => {
		// const chatImport = document.querySelector<RampikeFilePicker>("#main-chats-import")!;
		// chatImport.addEventListener("input", async () => {
		// 	// todo ask to pick a persona
		// 	const file = chatImport.input.files?.[0];
		// 	if (!file) return;

		// 	const raw = await nothrowAsync(file.text());
		// 	if (!raw.success) return;
		// 	const messages = raw.value
		// 		.split("\n")
		// 		.filter(l => l.trim())
		// 		.map(l => nothrow<STCMessage>(JSON.parse(l)))
		// 		.filter(c => c.success)
		// 		.map((c, ix) => stcToInternal(c.value, ix));
		// });

		listen(update => {
			if (update.storage !== "idb") return;
			if (update.store !== "chats") return;

			updateChatHandles();
		});
		updateChatHandles();
	}
}

async function updateChatHandles() {
	const list = document.querySelector("#main-chats")!;
	const handles = await idb.getAll("chats");
	if (!handles.success) return;
	list.innerHTML = "";

	const items = handles.value.reverse().map(handle => {
		const icon = mudcrack({
			tagName: "img",
			attributes: {
				src: placeholder(null)
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
							contents: handle.scenario.name,
						}),
						mudcrack({
							className: "hint",
							contents: messagesCaption(handle.messageCount),
						}),
						mudcrack({
							className: "row-compact main-chats-item-user",
							contents: [
								userIcon,
								mudcrack({
									contents: handle.userPersona.name
								})
							]
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
								click: () => window.location.hash = `play.${handle.id}`
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

function stcToInternal(stc: STCMessage, index: number): ChatMessage {
	return {
		id: index,
		from: stc.is_system
			? "system"
			: stc.is_user
				? "user"
				: "model",
		name: stc.name,
		swipes: stc.swipes ?? [stc.mes],
		selectedSwipe: 0,
		rember: null
	};
}

type STCMessage = {
	name: string,
	is_user: boolean,
	is_system: boolean,
	mes: string,
	swipes?: string[]
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
