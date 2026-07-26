import { textareaReconsider } from "@root/utils";
import { addMessage, deleteMessage, getMessageViewByID, loadPictures, loadResponse, preparePayload, reroll, setSwipe, updateSwipeIndex } from "./utils";
import { makeMessageView } from "./views";
import { toast } from "@units/toasts";
import { updateRemberCounter } from "./rember";
import { chatStore, messagesStore } from "@units/caching";

export async function sendMessage() {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	const textarea = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;

	const message = textarea.value?.trim();
	if (!message) return;

	const chat = await chatStore.read();
	if (!chat) return;
	const messages = await messagesStore.read();
	if (!messages) return;

	const payload = await preparePayload(messages.messages, chat.scenario.definition, message);

	const lastMessageId = messages.messages.findLast(() => true)?.id;
	getMessageViewByID(lastMessageId!)?.controls.setIsLast(false);

	const newUserMessage = await addMessage(chat.id, message, true, chat.userPersona.name);
	if (!newUserMessage) {
		toast("failed to save user message");
		return;
	}

	const swipesDisabled = (six: number) => {
		if (six > 0)
			toast(`attempt to swipe user message, mid: ${newUserMessage.id}, six: ${six}`);
	};
	const userMessage = makeMessageView(
		newUserMessage,
		await loadPictures(chat),
		false,
		// on edit
		(swipeIx, value) => {
			setSwipe(chat.id, newUserMessage.id, swipeIx, value);
		},
		// on reroll
		() => { throw Error("haha nope"); },
		() => deleteMessage(chat.id, newUserMessage.id),
		swipesDisabled
	);
	const newModelMessage = await addMessage(chat.id, "", false, chat.scenario.name);
	if (!newModelMessage) {
		toast("failed to save user message");
		return;
	}

	const responseMessage = makeMessageView(
		newModelMessage,
		await loadPictures(chat),
		true,
		// on edit
		(swipeIx, value) => {
			setSwipe(chat.id, newModelMessage.id, swipeIx, value);
		},
		// reroll
		() => reroll(chat.id, newModelMessage.id),
		() => { throw Error("haha nope"); },
		(six) => updateSwipeIndex(six, newModelMessage.id, chat.id)
	);
	list.append(userMessage, responseMessage);
	loadResponse(payload, newModelMessage.id, chat.id);

	textarea.value = "";
	textareaReconsider(textarea);

	updateRemberCounter();
	list.scrollTop = list.scrollHeight;
}
