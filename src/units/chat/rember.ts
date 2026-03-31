import { abortController, runProvider } from "@root/run";
import { ChatMessage, Result } from "@root/types";
import { dullMessage, getCurrentChat, updateRember } from "./utils";
import { idb, listen, local } from "@root/persist";
import { readActiveProviders, readProviders } from "@units/settings/providers";
import { RampikeModal } from "@rampike/modal";
import { setSelectOptions } from "@root/utils";
import { toast } from "@units/toasts";
import { remberMessageView, RemberView } from "./views";

export const REMBER_DEFAULTS = {
	stride: 10,
	prompt: [
		"provide summary of a text roleplay session described by the user.",
		"update provided state to reflect any changes to it.",
		"format trivia as a list of facts.",
		"stay concise and ignore any info irrelevant to possible future scenarios.",
		"do not provide any commentary, only describe the new state, do not change the format (the headings), do not include the chat history.",
		"follow this format when describing the roleplay state summary:",
		"```",
		"## current location",
		"",
		"## locations and objects",
		"",
		"## trivia",
		"",
		"## plans and intentions",
		"",
		"```"
	].join("\n")
}

export function initRember() {
	const modal        = document.querySelector<RampikeModal>       ("#play-rember")!;
	const providerPicker = document.querySelector<HTMLSelectElement>  ("#play-rember-provider-picker")!;
	const strideInput  = document.querySelector<HTMLInputElement>   ("#play-rember-stride")!;
	const prompt       = document.querySelector<HTMLTextAreaElement>("#play-rember-prompt")!;
	const buttons = {
		one:   document.querySelector<HTMLButtonElement>("#play-rember-add-one")!,
		all:   document.querySelector<HTMLButtonElement>("#play-rember-add-all")!,
		stop:  document.querySelector<HTMLButtonElement>("#play-rember-stop")!,
		save:  document.querySelector<HTMLButtonElement>("#play-rember-save")!,
		reset: document.querySelector<HTMLButtonElement>("#play-rember-reset")!
	}
	const list = document.querySelector<HTMLElement>("#play-rember-messages")!;

	buttons.one.addEventListener("click", runOne);
	buttons.all.addEventListener("click", runAll);
	buttons.stop.addEventListener("click", forgor);
	buttons.save.addEventListener("click", saveSettings);
	buttons.reset.addEventListener("click", resetPrompt);
	providerPicker.addEventListener("input", providerPickerChanged);
	buttons.stop.hidden = true;

	listen(u => {
		if (u.storage !== "local") return;
		if (u.key !== "activeProvider") return;

		updateProviderPicker();
	});
	updateProviderPicker();

	function updateProviderPicker() {
		const providerMap = readProviders();
		const providerOptions = Object.entries(providerMap);
		const activeId = providerOptions.find(([, e]) => e.remberActive)?.[0];
		setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId);
	}
	async function onOpen() {
		const state = await getCurrentChat();
		if (!state) return;

		// HACK: Remove optional after migrations
		prompt.value   = state.chat.rember?.prompt   ?? REMBER_DEFAULTS.prompt;

		list.innerHTML = "";

		const remberMessages = state.messages.messages.filter(m => m.rember);
		const items = remberMessages
			.map(m => remberMessageView(
				m.id,
				v => updateRember(v, m.id, state.chat.id),
				() => updateRember(null, m.id, state.chat.id),
				m.rember!
			))
			.toReversed();
		list.append(...items);
	}

	async function step() {
		const state = await getCurrentChat(true, false);
		if (!state) return;

		let view: RemberView | null = null;
		function checkView(mid: number) {
			if (!view) {
				view = remberMessageView(
					mid,
					v => updateRember(v, mid, state!.chat.id),
					() => updateRember(null, mid, state!.chat.id),
				);
				list.prepend(view);
			}
			return view;
		}
		
		const result = await runRember(
			(content, mid) => {
				checkView(mid).controls.appendContent(content);
				checkView(mid).controls.hideControls();
			},
			providerPicker.value,
			getStride(),
			prompt.value.trim(),
			state.chat.scenario.definition
		);
		if (!result.success) return false;
		checkView(result.value.mid).controls.enable(result.value.response);
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
			stride: getStride()
		};
		state.chat.rember = v;
		await idb.set("chats", state.chat);
	}
	function resetPrompt() {
		if (!confirm("the current rember prompt will be lost after saving the settings")) return;
		prompt.value = REMBER_DEFAULTS.prompt;
	}
	function providerPickerChanged() {
		const actives = readActiveProviders();
		actives.rember = providerPicker.value!;
		local.set("activeProvider", JSON.stringify(actives));
	}
	function getStride() {
		const value = parseInt(strideInput.value, 10);
		if (isNaN(value)) return REMBER_DEFAULTS.stride;
		return value;
	}

	return {
		open: () => {
			onOpen();
			modal.open();
		}
	}
}

type RemberError = "noload" | "iscomplete" | "noproviders" | "failed";

export async function runRember(
	onChunk: (chunk: string, mid: number) => void,
	provider: string,
	stride: number,
	prompt: string,
	system: string
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
	const noLastAction = messages.messages.slice(0, -2);
	let lix = noLastAction.findLastIndex(m => m.rember);
	const state = lix === -1
		? null
		: noLastAction[lix].rember!;
	if (lix === -1) lix = 0;
	const tix = Math.min(noLastAction.length - 1, lix + stride * 2);
	if (tix === lix) return { success: false, error: "iscomplete" };
	const scope = noLastAction.slice(lix, tix);

	const payload = prepareMessages(
		scope,
		{
			user: chat.userPersona.name,
			model: chat.scenario.name,
			system: ""
		},
		prompt, state, system
	);

	const providers = readProviders();
	if (!providers[provider]) return { success: false, error: "noproviders"};

	const response = await runProvider(payload, providers[provider], value => onChunk(value, tix));

	if (!response.success) {
		toast(response.error);
		return { success: false, error: "failed"};
	}
	
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
	state: string | null,
	system: string
): ChatMessage[] {
	const chat = parts
		.map(m => `## ${names[m.from]}:\n${m.swipes[m.selectedSwipe]}\n\n`)
		.join("\n");

	const payload = [
		...(state
			? [
				"# saved roleplay state",
				state,
				""
			]
			: []
		),
		"# chat history",
		chat
	].join("\n");

	const systemNested = system.replace(/^#+/gm, v => `#${v}`);

	return [
		dullMessage("system", prompt.replace("{{system}}", systemNested)),
		dullMessage("user", payload)
	];
}
