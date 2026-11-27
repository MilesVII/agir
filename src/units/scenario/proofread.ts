import { listen, local } from "@root/persist";
import { PromptMessage, Provider } from "@root/types";
import { makeResizable, renderMD, setSelectOptions, textareaReconsider } from "@root/utils";
import { mudcrack } from "rampike";
import { offerLongerRerun, runJob } from "@units/chat/generation";
import { loadMiscSettings, PROOFREAD_DEFAULT_PROMPT } from "@units/settings/misc";
import { readActiveProviders, readProviders } from "@units/settings/providers";
import { toast } from "@units/toasts";
import { makeProofreadChangeView } from "@views/proofread-change";
import { diffProofreadPrompt, parseProofreadAnswer, proofreadChanges, ProofreadSection } from "./proofread-diff";

/*
Proofread section at the bottom of the scenario editor: sends the character definition and the
opening messages to a provider of choice with a proofreading system prompt and renders the answer.
The default prompts live in settings; the editor's copy can be tweaked per run.
Two modes: the diff mode (default) asks for corrected text and lets the user accept, reject or edit
each change, see proofread-diff.ts; the other one asks for a list of findings and shows it as is.
*/

export type ProofreadDraft = {
	name: string,
	definition: string,
	openings: string[]
};

/** where a section of the editor goes */
export type ProofreadField = { definition: true } | { opening: number };
/** the editor's fields; `replace` writes nothing and returns false unless the field still holds `expected` */
export type ProofreadTarget = {
	draft: () => ProofreadDraft,
	replace: (field: ProofreadField, expected: string, next: string) => boolean,
	/** selects `start..end` of the field's trimmed text and scrolls to it; same check as `replace` */
	select: (field: ProofreadField, expected: string, start: number, end: number) => boolean
};

export function initProofread(target: ProofreadTarget) {
	const draft = target.draft;
	const providerPicker = document.querySelector<HTMLSelectElement>  ("#scenario-proofread-provider")!;
	const diffModeToggle = document.querySelector<HTMLInputElement>   ("#scenario-proofread-diff-mode")!;
	const review         = document.querySelector<HTMLElement>        ("#scenario-proofread-review")!;
	const promptInput    = document.querySelector<HTMLTextAreaElement>("#scenario-proofread-prompt")!;
	const resetButton    = document.querySelector<HTMLButtonElement>  ("#scenario-proofread-reset")!;
	const runButton      = document.querySelector<HTMLButtonElement>  ("#scenario-proofread-run")!;
	const output         = document.querySelector<HTMLElement>        ("#scenario-proofread-output")!;
	/** true once the user touched the prompt: settings updates then leave it alone */
	let promptEdited = false;

	makeResizable(promptInput);
	promptInput.addEventListener("input", () => promptEdited = true);
	resetButton.addEventListener("click", fillPrompt);
	runButton.addEventListener("click", () => run());
	diffModeToggle.addEventListener("change", () => {
		local.set("settings", JSON.stringify({ ...loadMiscSettings(), proofreadDiff: diffModeToggle.checked }));
		fillPrompt();
	});
	providerPicker.addEventListener("input", () => {
		const actives = readActiveProviders();
		actives.proofread = providerPicker.value;
		local.set("activeProvider", JSON.stringify(actives));
	});

	listen(u => {
		if (u.storage !== "local") return;
		if (u.key === "activeProvider" || u.key === "providers") updateProviderPicker();
		if (u.key === "settings") {
			diffModeToggle.checked = loadMiscSettings().proofreadDiff;
			if (!promptEdited) fillPrompt();
		}
	});
	diffModeToggle.checked = loadMiscSettings().proofreadDiff;
	updateProviderPicker();
	fillPrompt();

	function fillPrompt() {
		const settings = loadMiscSettings();
		promptInput.value = settings.proofreadDiff ? settings.proofreadDiffPrompt : settings.proofreadPrompt;
		textareaReconsider(promptInput);
		promptEdited = false;
	}
	function updateProviderPicker() {
		const providerOptions = Object.entries(readProviders());
		const activeId = providerOptions.find(([, e]) => e.proofreadActive)?.[0];
		setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId);
	}

	/** `override` replaces the picked provider for this run */
	async function run(override?: Provider) {
		const provider = override ?? readProviders()[providerPicker.value];
		if (!provider) {
			toast("pick a provider for proofreading first");
			return;
		}
		const d = draft();
		if (!d.definition.trim() && d.openings.every(o => !o.trim())) {
			toast("nothing to proofread yet");
			return;
		}

		if (diffModeToggle.checked) {
			await runDiff(provider, d);
			return;
		}

		runButton.disabled = true;
		review.hidden = true;
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
		const final = (result.value.text.trim()) || text;
		text = final.replaceAll("$\\rightarrow$", " → ") || "*the model returned nothing*";
		show();
		if (result.value.finishReason === "length") offerLongerRerun("proofread", provider, result.value.seed, run);
	}

	async function runDiff(provider: Provider, d: ProofreadDraft) {
		const sections: (ProofreadSection & { field: ProofreadField })[] = [];
		if (d.definition.trim())
			sections.push({ key: "definition", label: "Character definition", base: d.definition.trim(), field: { definition: true } });
		d.openings.forEach((o, ix) => sections.push({
			key: `opening_${ix + 1}`,
			label: d.openings.length > 1 ? `Opening message ${ix + 1}` : "Opening message",
			base: o.trim(),
			field: { opening: ix }
		}));

		runButton.disabled = true;
		output.hidden = true;
		review.hidden = false;
		const progress = mudcrack({ className: "hint", contents: "proofreading..." });
		review.replaceChildren(progress);

		// the answer repeats the whole text, so its length says how far along it is
		const expected = sections.reduce((sum, s) => sum + s.base.length, 0);
		let text = "";
		const result = await runJob("proofread", provider, diffProofreadPrompt(promptInput.value, sections), {
			onChunk: chunk => {
				text += chunk;
				progress.textContent = `proofreading... ${Math.min(99, Math.floor(text.length / expected * 100))}%`;
			}
		});
		runButton.disabled = false;

		if (!result.success) {
			toast(result.error);
			review.hidden = true;
			return;
		}
		const answer = result.value.text.trim() || text;
		const fixed = parseProofreadAnswer(answer, sections);
		if ([...fixed.values()].every(f => f === null)) {
			// no section came back in its tags: show whatever the model said instead
			review.hidden = true;
			output.hidden = false;
			output.innerHTML = renderMD(`*The model didn't answer in the expected format. Its answer as is:*\n\n${answer || "*nothing*"}`);
		} else {
			renderReview(sections, fixed);
		}
		if (result.value.finishReason === "length") offerLongerRerun("proofread", provider, result.value.seed, run);
	}

	function renderReview(sections: (ProofreadSection & { field: ProofreadField })[], fixed: Map<string, string | null>) {
		const views: ReturnType<typeof makeProofreadChangeView>[] = [];
		const blocks = sections.map(section => {
			const corrected = fixed.get(section.key);
			const caption = mudcrack({ className: "hint" });
			const block = mudcrack({ className: "list", contents: [mudcrack({ contents: section.label }), caption] });
			if (corrected === null || corrected === undefined) {
				caption.textContent = "missing from the answer, probably cut off";
				return block;
			}
			const changes = proofreadChanges(section.base, corrected);
			caption.textContent = changes.length === 0
				? "no changes"
				: `${changes.length} change${changes.length === 1 ? "" : "s"}`;

			// the text as it is in the editor now, and where each change sits in it
			let current = section.base;
			const live = changes.map(c => ({ at: c.start, length: c.before.length }));
			const stale = () => toast(`the ${section.label.toLowerCase()} was edited after proofreading; run it again`);
			const show = (ix: number) => {
				const l = live[ix];
				if (!target.select(section.field, current, l.at, l.at + l.length)) stale();
			};
			const put = (ix: number, text: string) => {
				const l = live[ix];
				const next = current.slice(0, l.at) + text + current.slice(l.at + l.length);
				if (!target.replace(section.field, current, next)) {
					stale();
					return false;
				}
				const delta = text.length - l.length;
				for (const other of live) if (other.at > l.at) other.at += delta;
				l.length = text.length;
				current = next;
				return true;
			};

			changes.forEach((c, ix) => {
				const view = makeProofreadChangeView(
					{ ...changeContext(section.base, c.start, c.start + c.before.length), before: c.before, after: c.after },
					{
						accept: text => put(ix, text),
						undo: () => put(ix, c.before),
						show: () => show(ix)
					}
				);
				views.push(view);
				block.append(view.root);
			});
			return block;
		});

		const controls = views.length === 0
			? [mudcrack({ className: "hint", contents: "No changes suggested." })]
			: [
				mudcrack({ tagName: "button", className: "lineout fit", contents: "accept all", events: {
					click: () => views.forEach(v => v.accept())
				} }),
				mudcrack({ tagName: "button", className: "lineout fit", contents: "reject all", events: {
					click: () => views.forEach(v => v.reject())
				} })
			];
		const close = mudcrack({ tagName: "button", className: "lineout fit float-end", contents: "close", events: {
			click: () => {
				review.hidden = true;
				review.replaceChildren();
			}
		} });
		review.replaceChildren(mudcrack({ className: "row-wrap align-center", contents: [...controls, close] }), ...blocks);
	}
}

/** up to a line, or 60 characters, of text on each side of a change */
function changeContext(text: string, start: number, end: number) {
	const CONTEXT = 60;
	const lineStart = text.lastIndexOf("\n", start - 1) + 1;
	const newline = text.indexOf("\n", end);
	const lineEnd = newline === -1 ? text.length : newline;
	const from = Math.max(lineStart, start - CONTEXT);
	const to = Math.min(lineEnd, end + CONTEXT);
	return {
		prefix: (from > lineStart ? "…" : "") + text.slice(from, start),
		suffix: text.slice(end, to) + (to < lineEnd ? "…" : "")
	};
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
