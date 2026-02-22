import { runEngine } from "@root/run";
import { ChatMessage } from "@root/types";
import { loadMiscSettings } from "@units/settings/misc";
import { dullMessage, getCurrentChat } from "./utils";
import { idb, listen, local } from "@root/persist";
import { readActiveEngines, readEngines } from "@units/settings/engines";
import { RampikeModal } from "@rampike/modal";
import { getRoute, setSelectOptions } from "@root/utils";
import { mudcrack } from "rampike";

const remberDefaults = {
	prompt: [
		"you are tasked with providing summary of a text roleplay session.",
		"update provided state to reflect any changes to the state of the scenario.",
		"keep track of current location, list other locations and their contents, and any trivia about characters that may be relevant later.",
		"note plans and intentions of the character.",
		"format trivia as a list of facts.",
		"stay concise and remove info irrelevant to possible future scenarios.",
		"do not provide any commentary, only describe the new state, do not change the format (the headings), but you may add sub-headings if needed"
	].join("\n"),
	stateTemplate: [
		"# state",
		"## current location",
		"",
		"## locations and objects",
		"",
		"## trivia",
		"",
		"## plans and intentions",
		""
	].join("\n")
}

export function initRember() {
	const modal        = document.querySelector<RampikeModal>       ("#play-rember")!;
	const enginePicker = document.querySelector<HTMLSelectElement>  ("#play-rember-engine-picker")!;
	const stride       = document.querySelector<HTMLInputElement>   ("#play-rember-stride")!;
	const prompt       = document.querySelector<HTMLTextAreaElement>("#play-rember-prompt")!;
	const template     = document.querySelector<HTMLTextAreaElement>("#play-rember-template")!;
	const buttons = {
		one:  document.querySelector<HTMLButtonElement>  ("#play-rember-add-one")!,
		all:  document.querySelector<HTMLButtonElement>  ("#play-rember-add-all")!,
		stop: document.querySelector<HTMLButtonElement>  ("#play-rember-stop")!,
		save: document.querySelector<HTMLButtonElement>  ("#play-rember-save")!
	}
	const list         = document.querySelector<HTMLButtonElement>  ("#play-rember-messages")!;

	buttons.one.addEventListener("click", runOne);
	buttons.all.addEventListener("click", runAll);
	buttons.save.addEventListener("click", saveSettings);
	buttons.stop.addEventListener("click", forgor);
	enginePicker.addEventListener("input", enginePickerChanged);

	listen(u => {
		if (u.storage !== "local") return;
		if (u.key !== "activeEngine") return;

		updateEnginePicker();
	});
	updateEnginePicker();

	function updateEnginePicker() {
		const engineMap = readEngines();
		const engineOptions = Object.entries(engineMap);
		const activeId = engineOptions.find(([, e]) => e.remberActive)?.[0];
		setSelectOptions(enginePicker, engineOptions.map(([id, e]) => [id, e.name]), activeId);
	}
	async function onOpen() {
		const state = await getCurrentChat();
		if (!state) return;

		prompt.value   = state.chat.rember?.prompt   ?? remberDefaults.prompt;
		template.value = state.chat.rember?.template ?? remberDefaults.stateTemplate;

		list.innerHTML = "";

		const remberMessages = state.messages.messages.filter(m => m.rember);
		list.append(...remberMessages.map(m => remberMessageView(m).container));
	}
	async function runOne() {
		await runRember(chatId, )
	}
	async function runAll() {
		await runRember(chatId, )
	}
	function forgor() {

	}
	async function saveSettings() {
		const state = await getCurrentChat(true, false);
		if (!state) return;
		state.chat.rember.prompt = prompt.value;
		state.chat.rember.template = template.value;
		await idb.set("chats", state.chat);
	}
	function enginePickerChanged() {
		const actives = readActiveEngines();
		actives.rember = enginePicker.value!;
		local.set("activeEngine", JSON.stringify(actives));
	}

	return {
		open: () => {
			onOpen();
			modal.open();
		}
	}
}

export async function runRember(
	onChunk: (chunk: string) => void,
	stride: number,
	prompt: string,
	state: string
) {
	const eh = await getCurrentChat();
	if (!eh) return;
	const { chat, messages } = eh;
	const lix = messages.messages.findLastIndex(m => m.rember);

	const mix = messages.findIndex(m => m.id === messageId);
	if (mix < 0) return;

	const payload = prepareMessages(
		messages.slice(0, mix + 1),
		{
			user: chat.userPersona.name,
			model: chat.scenario.name,
			system: ""
		},
		prompt, state
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
	prompt: string,
	state: string
): ChatMessage[] {
	const chat = parts
		.map(m => `## ${names[m.from]}:\n${m.swipes[m.selectedSwipe]}\n\n`)
		.join("\n");

	const payload = [
		state,
		"# chat history",
		chat
	].join("\n");

	return [
		dullMessage("system", prompt),
		dullMessage("user", payload)
	];
}

function remberMessageView(message: ChatMessage) {
	const container = mudcrack({
		tagName: "div",
		className: "lineout",
		contents: message.rember!
	});

	function appendContent(value: string) {
		container.textContent += value;
	}

	return {
		container,
		appendContent
	};
}
