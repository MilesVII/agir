import html from "./chat-handle.html";
import { Chat, Folder } from "@root/types";
import { placeholder, setSelectMenu } from "@root/utils";
import { htmlTemplate, sprout } from "rampike";
import { PictureSource, setPicture } from "./common";

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

const template = htmlTemplate(html);
const REFS = {
	icon:        HTMLImageElement,
	"user-icon": HTMLImageElement,
	title:       HTMLElement,
	"user-name": HTMLElement,
	messages:    HTMLElement,
	memo:        HTMLButtonElement,
	play:        HTMLButtonElement,
	delete:      HTMLButtonElement,
	folder:      HTMLSelectElement
};

/** One chat in the main chat list */
export function makeChatHandleView(
	handle: Chat,
	pictures: ChatHandlePictures,
	folderOptions: string[],
	handlers: ChatHandleHandlers
) {
	const { root, refs: r } = sprout(template, REFS);

	r.icon.src = placeholder(null);
	r["user-icon"].src = placeholder(null);
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
		r.folder,
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
