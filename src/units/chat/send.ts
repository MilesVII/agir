import { getRoute } from "@root/utils";
import { RampikeTabs } from "@rampike/tabs";
import { idb, listen } from "@root/persist";
import { runEngine } from "@root/run";
import { ChatMessage } from "@root/types";
import { readEngines } from "@units/settings/engines";
import { loadPictures, makeMessageView, pushSwipe, RampikeMessageView } from "./utils";

export async function sendMessage() {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	const textarea = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;
	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;

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
	inputModes.tab = "pending";

	const lastMessageId = messages.value.messages.findLast(() => true)?.id;
	list.querySelector<RampikeMessageView>(`.message[data-mid="${lastMessageId}"]`)?.rampike.params.controls.setIsLast(false);

	const pushedResult = await pushSwipe(meta.value.id, message, true, meta.value.userPersona.name);
	if (!pushedResult) {
		console.error("failed to save user message");
		return;
	}

	const userMessage = makeMessageView(pushedResult.updatedMessage, meta.value, await loadPictures(meta.value), false);
	const responseMessage = makeMessageView({
		from: "model",
		id: -1,
		name: meta.value.scenario.name,
		rember: null,
		selectedSwipe: 0,
		swipes: [""]
	}, meta.value, await loadPictures(meta.value), true);
	list.append(userMessage, responseMessage);

	await gainResponse(payload, responseMessage, meta.value.id, meta.value.scenario.name);

	textarea.value = "";
	inputModes.tab = "main";
}

export async function preparePayload(contents: ChatMessage[], systemPrompt: string, userMessage: string) {
	// TODO: Get tail length from settings
	const system: ChatMessage = { from: "system", id: -1, name: "", rember: null, swipes: [systemPrompt], selectedSwipe: 0 };
	const payload: ChatMessage[] = [
		system,
		...contents.slice(-10)
	];
	if (!userMessage) return payload;

	const user: ChatMessage = { from: "user", id: -1, name: "", rember: null, swipes: [userMessage], selectedSwipe: 0 };
	payload.push(user);
	return payload;
}

export async function gainResponse(payload: ChatMessage[], responseMessage: RampikeMessageView, chatId: string, name: string) {
	// TODO: Pick default engine
	const [, engine] = Object.entries(readEngines())[0];

	const responseMessageControls = responseMessage.rampike.params.controls;
	const responseStreamingUpdater = responseMessageControls.startStreaming();

	const streamingResult = await runEngine(payload, engine, responseStreamingUpdater);
	if (streamingResult.success) {
		const pushedResponseResult = await pushSwipe(chatId, streamingResult.value, false, name);
		if (!pushedResponseResult) {
			console.error("failed to save response message");
			return;
		}
		responseMessageControls.updateMessage(pushedResponseResult.updatedMessage);
	} else {
		console.error("response issues");
	}
	responseMessageControls.endStreaming();
}
