import { abortController, runEngine } from "@root/run";
import { ChatMessage, Result } from "@root/types";
import { loadMiscSettings } from "@units/settings/misc";
import { dullMessage, getCurrentChat } from "./utils";
import { idb, listen, local } from "@root/persist";
import { readActiveEngines, readEngines } from "@units/settings/engines";
import { RampikeModal } from "@rampike/modal";
import { getRoute, setSelectOptions } from "@root/utils";
import { mudcrack } from "rampike";

const remberDefaults = {
	stride: 10,
	prompt: [
		"you are tasked with providing summary of a text roleplay session.",
		"update provided state to reflect any changes to the state of the scenario.",
		"keep track of current location, list other locations and their contents, and any trivia about characters that may be relevant later.",
		"note plans and intentions of the character.",
		"format trivia as a list of facts.",
		"stay concise and ignore any info irrelevant to possible future scenarios.",
		"do not provide any commentary, only describe the new state, do not change the format (the headings)"
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
	const strideInput  = document.querySelector<HTMLInputElement>   ("#play-rember-stride")!;
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
	buttons.stop.addEventListener("click", forgor);
	buttons.save.addEventListener("click", saveSettings);
	enginePicker.addEventListener("input", enginePickerChanged);
	buttons.stop.hidden = true;

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
		const items = remberMessages
			.map(m => remberMessageView(m.id, m.rember!).container)
			.toReversed();
		list.append(...items);
	}

	async function step() {
		let view: RemberView | null = null;
		function checkView(mid: number) {
			if (!view) {
				view = remberMessageView(mid);
				list.prepend(view.container);
			}
			return view;
		}
		const result = await runRember(
			(content, mid) => {
				checkView(mid).appendContent(content);
			},
			enginePicker.value,
			getStride(),
			prompt.value.trim(),
			template.value.trim()
		);
		console.log(result)
		if (!result.success) return false;
		checkView(result.value.mid).enable(result.value.response);
		return true;
	}
	async function runOne() {
		buttons.one.hidden  = true;
		buttons.all.hidden  = true;
		buttons.stop.hidden = false;
		await step();
		buttons.one.hidden  = false;
		buttons.all.hidden  = false;
		buttons.stop.hidden = true;
	}
	let interruptFlag = false;
	async function runAll() {
		buttons.one.hidden  = true;
		buttons.all.hidden  = true;
		buttons.stop.hidden = false;
		while (!interruptFlag) {
			const proceed = await step();
			if (!proceed) break;
		}
		interruptFlag = false;
		buttons.one.hidden  = false;
		buttons.all.hidden  = false;
		buttons.stop.hidden = true;
	}
	function forgor() {
		interruptFlag = true;
		abortController.abort();
	}
	async function saveSettings() {
		const state = await getCurrentChat(true, false);
		if (!state) return;
		const v = {
			prompt: prompt.value.trim(),
			template: template.value.trim(),
			stride: getStride()
		};
		state.chat.rember = v;
		await idb.set("chats", state.chat);
	}
	function enginePickerChanged() {
		const actives = readActiveEngines();
		actives.rember = enginePicker.value!;
		local.set("activeEngine", JSON.stringify(actives));
	}
	function getStride() {
		const value = parseInt(strideInput.value, 10);
		if (isNaN(value)) return remberDefaults.stride;
		return value;
	}

	return {
		open: () => {
			onOpen();
			modal.open();
		}
	}
}

type RemberError = "noload" | "iscomplete" | "noengines" | "failed";

export async function runRember(
	onChunk: (chunk: string, mid: number) => void,
	engine: string,
	stride: number,
	prompt: string,
	stateTemplate: string
): Promise<Result<{ response: string, mid: number }, RemberError>> {
	/*
	chat example:
	mid, from
	0 [model]
	1 [user]
	2 [model]
	3 [user, rember] <- this rember summarizes [0;3)
	4 [model]
	5 [user]
	6 [model]

	on new rember call:
	start = lix; // 3
	end = tix = start + stride * 2
	*/
	const eh = await getCurrentChat();
	if (!eh) return { success: false, error: "noload"};
	const { chat, messages } = eh;
	let lix = messages.messages.findLastIndex(m => m.rember);
	const state = lix === -1
		? stateTemplate
		: messages.messages[lix].rember!;
	if (lix === -1) lix = 0;
	const tix = Math.min(messages.messages.length - 1, lix + stride * 2);
	if (tix === lix) return { success: false, error: "iscomplete"};
	const scope = messages.messages.slice(lix, tix);

	const payload = prepareMessages(
		scope,
		{
			user: chat.userPersona.name,
			model: chat.scenario.name,
			system: ""
		},
		prompt, state
	);

	const engines = readEngines();

	if (!engines[engine]) return { success: false, error: "noengines"};

	const response = await runEngine(payload, engines[engine], value => onChunk(value, tix));

	if (!response.success) return { success: false, error: "failed"};
	
	const thinkingParts = response.value.split("</think>");
	const result = (thinkingParts[1] ?? thinkingParts[0]!).trim();

	messages.messages[tix].rember = result;
	await idb.set("chatContents", messages);

	return {
		success: true,
		value: {
			response: result,
			mid: tix
		}
	};
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

function remberMessageView(messageId: number, contents: string = "") {
	const container = mudcrack({
		tagName: "div",
		className: "lineout chat-rember-view",
		contents,
		attributes: {
			title: String(messageId)
		}
	});
	// edit and delete, show mId

	function appendContent(value: string) {
		container.textContent += value;
	}
	function enable(value: string) {
		container.textContent = value;
	}

	return {
		container,
		appendContent,
		enable
	};
}

type RemberView = ReturnType<typeof remberMessageView>;
