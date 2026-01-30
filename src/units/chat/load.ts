import { idb } from "@root/persist";
import { deleteMessage, loadPictures, reroll, setSwipe } from "./utils";
import { makeMessageView } from "./message-view";

export async function loadMessages(chatId: string) {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	list.innerHTML = "";

	const [contents, meta] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!contents.success || !meta.success) return;

	const [userPic, modelPic] = await loadPictures(meta.value);

	const messages = contents.value.messages;
	const items = messages.map((item, ix) => {
		return makeMessageView(
			item,
			// meta.value,
			[userPic, modelPic],
			ix === messages.length - 1,
			(swipeIx, value) => {
				setSwipe(chatId, item.id, swipeIx, value);
			},
			() => reroll(chatId, item.id, meta.value.scenario.name),
			() => deleteMessage(chatId, item.id)
		);
	});

	list.append(...items);
	// items[items.length - 1].scrollIntoView(false);
	list.scrollTop = list.scrollHeight;
}
