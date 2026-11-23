import { Chat } from "@root/types";
import html from "./started-chat.html";
import { htmlTemplate, sprout } from "rampike";
import { messagesCaption } from "./chat-handle";
import { PictureSource, setPicture } from "./common";

const template = htmlTemplate(html);
const REFS = {
	"user-icon":     HTMLImageElement,
	"user-name":     HTMLElement,
	"message-count": HTMLElement,
	"last-update":   HTMLElement,
	"memo":          HTMLElement
};

export function makeStartedChatView(chat: Chat, userIcon: PictureSource, play: () => void) {
	const { root, refs: r } = sprout(template, REFS);

	setPicture(r["user-icon"], userIcon);
	r["user-name"].textContent = chat.userPersona.name;
	r["message-count"].textContent = messagesCaption(chat.messageCount);
	r["last-update"].textContent = new Date(chat.lastUpdate).toLocaleString();

	if (chat.memo)
		r.memo.textContent = chat.memo;
	else
		r.memo.hidden = true;

	root.addEventListener("click", play);

	return root;
}
