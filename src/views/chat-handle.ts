import template from "./chat-handle.html";
import { Chat, Folder } from "@root/types";
import { placeholder, setSelectMenu } from "@root/utils";
import { instantiate, pickRefs, PictureSource, setPicture } from "./common";

export type ChatHandlePictures = {
	scenario: PictureSource,
	user: PictureSource
};
export type ChatHandleHandlers = {
	play: () => void,
	delete: () => void,
	setMemo: () => void,
	assignFolder: (folder: Folder) => void,
	newFolder: () => void
};

/** One chat in the main chat list */
export function makeChatHandleView(
	handle: Chat,
	pictures: ChatHandlePictures,
	folderOptions: string[],
	handlers: ChatHandleHandlers
) {
	const root = instantiate(template);
	const r = pickRefs(root, ["icon", "title", "user-icon", "user-name", "messages", "memo", "play", "folder", "delete"]);

	(r.icon as HTMLImageElement).src = placeholder(null);
	(r["user-icon"] as HTMLImageElement).src = placeholder(null);
	setPicture(r.icon, pictures.scenario);
	setPicture(r["user-icon"], pictures.user);

	r.title.textContent = handle.scenario.name;
	r["user-name"].textContent = handle.userPersona.name;
	r.messages.textContent = messagesCaption(handle.messageCount);
	r.memo.textContent = handle.memo ?? "📝";

	r.icon.addEventListener("click", handlers.play);
	r.title.addEventListener("click", handlers.play);
	r.play.addEventListener("click", handlers.play);
	r.memo.addEventListener("click", handlers.setMemo);
	r.delete.addEventListener("click", handlers.delete);
	setSelectMenu(
		r.folder as HTMLSelectElement,
		handle.folder ?? "-folder-",
		[
			["unassigned", () => handlers.assignFolder(null)],
			["new folder", handlers.newFolder],
			...folderOptions.map(f => [f, () => handlers.assignFolder(f)] as [string, () => void])
		]
	);

	return root;
}

export function messagesCaption(count: number) {
	const singular = count === 1 || (count % 10 === 1 && count % 100 !== 11);
	return `${count} ${singular ? "message" : "messages"}`;
}
