import { getRoute, textareaReconsider } from "@root/utils";
import { idb } from "@root/persist";
import { addMessage, deleteMessage, getMessageViewByID, loadPictures, loadResponse, preparePayload, pushSwipe, reroll, setSwipe } from "./utils";
import { makeMessageView } from "./message-view";

export async function sendMessage() {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	const textarea = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;

	const message = textarea.value?.trim();
	if (!message) return;

	const [, chatId] = getRoute();
	if (!chatId) return;

	const [messages, meta] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!messages.success || !meta.success) return;

	const payload = await preparePayload(messages.value.messages, meta.value.scenario.definition, message);

	const lastMessageId = messages.value.messages.findLast(() => true)?.id;
	getMessageViewByID(lastMessageId!)?.rampike.params.setIsLast(false);

	const newUserMessage = await addMessage(meta.value.id, message, true, meta.value.userPersona.name);
	if (!newUserMessage) {
		console.error("failed to save user message");
		return;
	}

	const userMessage = makeMessageView(
		newUserMessage,
		await loadPictures(meta.value),
		false,
		// on edit
		(swipeIx, value) => {
			setSwipe(chatId, newUserMessage.id, swipeIx, value);
		},
		// on reroll
		() => { throw Error("haha nope"); },
		() => deleteMessage(chatId, newUserMessage.id)
	);
	const newModelMessage = await addMessage(meta.value.id, "", false, meta.value.scenario.name);
	if (!newModelMessage) {
		console.error("failed to save user message");
		return;
	}

	const responseMessage = makeMessageView(
		newModelMessage,
		await loadPictures(meta.value),
		true,
		// on edit
		(swipeIx, value) => {
			setSwipe(chatId, newModelMessage.id, swipeIx, value);
		},
		// reroll
		() => reroll(chatId, newModelMessage.id, meta.value.scenario.name),
		() => { throw Error("haha nope"); }
	);
	list.append(userMessage, responseMessage);
	loadResponse(payload, newModelMessage.id, meta.value.id, meta.value.scenario.name);

	textarea.value = "";
	textareaReconsider(textarea);
	
	list.scrollTop = list.scrollHeight;
}
