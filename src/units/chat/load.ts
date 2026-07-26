import { deleteMessage, loadPictures, reroll, setSwipe, updateSwipeIndex } from "./utils";
import { makeMessageView } from "./views";
import { updateTitle } from "@root/utils";
import { chatStore, messagesStore } from "@units/caching";

export function clearMessageViews() {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	list.innerHTML = "";
}

export async function loadMessages(chatId: string) {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	list.innerHTML = "";

	const chat = await chatStore.read();
	if (!chat) return;
	const messages = await messagesStore.read();
	if (!messages) return;
	if (chat.id !== messages.id) return;
	
	updateTitle(chat.scenario.name);

	const [userPic, modelPic] = await loadPictures(chat);

	const items = messages.messages.map((item, ix) => {
		return makeMessageView(
			item,
			[userPic, modelPic],
			ix === messages.messages.length - 1,
			(swipeIx, value) => {
				setSwipe(chatId, item.id, swipeIx, value);
			},
			() => reroll(chatId, item.id),
			() => deleteMessage(chatId, item.id),
			(six) => updateSwipeIndex(six, item.id, chatId)
		);
	});

	list.append(...items);
	list.scrollTop = list.scrollHeight;
}
