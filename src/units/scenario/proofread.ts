import { listen, local } from "@root/persist";
import { PromptMessage } from "@root/types";
import { makeResizable, renderMD, setSelectOptions, textareaReconsider } from "@root/utils";
import { runJob } from "@units/chat/generation";
import { loadMiscSettings, PROOFREAD_DEFAULT_PROMPT } from "@units/settings/misc";
import { readActiveProviders, readProviders } from "@units/settings/providers";
import { toast } from "@units/toasts";

/*
Proofread section at the bottom of the scenario editor: sends the character definition and the
opening messages to a provider of choice with a proofreading system prompt and renders the answer.
The default prompt lives in settings; the editor's copy can be tweaked per run.
*/

export type ProofreadDraft = {
	name: string,
	definition: string,
	openings: string[]
};

export function initProofread(draft: () => ProofreadDraft) {
	const providerPicker = document.querySelector<HTMLSelectElement>  ("#scenario-proofread-provider")!;
	const promptInput    = document.querySelector<HTMLTextAreaElement>("#scenario-proofread-prompt")!;
	const resetButton    = document.querySelector<HTMLButtonElement>  ("#scenario-proofread-reset")!;
	const runButton      = document.querySelector<HTMLButtonElement>  ("#scenario-proofread-run")!;
	const output         = document.querySelector<HTMLElement>        ("#scenario-proofread-output")!;
	/** true once the user touched the prompt: settings updates then leave it alone */
	let promptEdited = false;

	makeResizable(promptInput);
	promptInput.addEventListener("input", () => promptEdited = true);
	resetButton.addEventListener("click", fillPrompt);
	runButton.addEventListener("click", run);
	providerPicker.addEventListener("input", () => {
		const actives = readActiveProviders();
		actives.proofread = providerPicker.value;
		local.set("activeProvider", JSON.stringify(actives));
	});

	listen(u => {
		if (u.storage !== "local") return;
		if (u.key === "activeProvider" || u.key === "providers") updateProviderPicker();
		if (u.key === "settings" && !promptEdited) fillPrompt();
	});
	updateProviderPicker();
	fillPrompt();

	function fillPrompt() {
		promptInput.value = loadMiscSettings().proofreadPrompt;
		textareaReconsider(promptInput);
		promptEdited = false;
	}
	function updateProviderPicker() {
		const providerOptions = Object.entries(readProviders());
		const activeId = providerOptions.find(([, e]) => e.proofreadActive)?.[0];
		setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId);
	}

	async function run() {
		const provider = readProviders()[providerPicker.value];
		if (!provider) {
			toast("pick a provider for proofreading first");
			return;
		}
		const d = draft();
		if (!d.definition.trim() && d.openings.every(o => !o.trim())) {
			toast("nothing to proofread yet");
			return;
		}

		runButton.disabled = true;
		output.hidden = false;
		output.innerHTML = renderMD("*proofreading...*");

		// the answer is re-rendered at most once a frame while it streams
		let text = "";
		let scheduled = false;
		const show = () => {
			scheduled = false;
			output.innerHTML = renderMD(text);
		};
		const result = await runJob("proofread", provider, proofreadPrompt(promptInput.value, d), {
			onChunk: chunk => {
				text += chunk;
				if (scheduled) return;
				scheduled = true;
				requestAnimationFrame(show);
			}
		});
		runButton.disabled = false;

		if (!result.success) {
			toast(result.error);
			output.innerHTML = renderMD(text || "*no answer*");
			return;
		}
		text = result.value.trim() || "*the model returned nothing*";
		show();
	}
}

/** system prompt plus the draft as a single user message with markdown headings */
export function proofreadPrompt(systemPrompt: string, d: ProofreadDraft): PromptMessage[] {
	const sections = [
		`# Roleplay system prompt definition`,
		d.definition.trim().replace(/^#+/gm, v => `#${v}`) || "(empty)",
		...d.openings.flatMap((o, ix) => [
			`# Opening message${d.openings.length > 1 ? ` ${ix + 1}` : ""}`,
			o.trim().replace(/^#+/gm, v => `#${v}`) || "(empty)"
		])
	];
	return [
		{ role: "system", content: systemPrompt.trim() || PROOFREAD_DEFAULT_PROMPT },
		{ role: "user", content: sections.join("\n\n") }
	];
}
