import { runEngine } from "@root/run";
import { ChatMessage } from "@root/types";
import { loadMiscSettings } from "@units/settings/misc";
import { dullMessage } from "./utils";
import { idb } from "@root/persist";
import { readActiveEngines, readEngines } from "@units/settings/engines";

export async function runRember(
	chatId: string,
	messageId: number,
	onChunk: (chunk: string) => void
) {
	const [contents, chat] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!contents.success || !chat.success) return;
	const messages = contents.value.messages;

	const mix = messages.findIndex(m => m.id === messageId);
	if (mix < 0) return;

	const payload = prepareMessages(
		messages.slice(0, mix + 1),
		{
			user: chat.value.userPersona.name,
			model: chat.value.scenario.name,
			system: ""
		}
	);

	const activeEngines = readActiveEngines();
	const engines = readEngines();

	if (!activeEngines.rember || !engines[activeEngines.rember]) return;

	const response = await runEngine(payload, engines[activeEngines.rember], onChunk);

	if (!response.success) return;
	
	const thinkingParts = response.value.split("</think>");
	return (thinkingParts[1] ?? thinkingParts[0]!).trim();
}

function prepareMessages(
	parts: ChatMessage[],
	names: Record<ChatMessage["from"], string>,
): ChatMessage[] {
	const settings = loadMiscSettings();
	const prompt = settings.remberPrompt;
	const stateTemplate = settings.remberTemplate; // or use previous state if available, should be provided as parameter

	const chat = parts
		.map(m => `## ${names[m.from]}:\n${m.swipes[m.selectedSwipe]}\n\n`)
		.join("\n");

	const payload = [
		stateTemplate,
		"# chat history",
		chat
	].join("\n");

	return [
		dullMessage("system", prompt),
		dullMessage("user", payload)
	];
}
