import { listen, local } from "@root/persist";
import { makeResizable, nothrow } from "@root/utils";
import { MACROS } from "@units/chat/macros";
import { toast } from "@units/toasts";

export function initMisc() {
	const tailInput = document.querySelector<HTMLInputElement>("#settings-options-tail")!;
	const remberStretchInput = document.querySelector<HTMLInputElement>("#settings-options-rember-stretch")!;
	const oocAsUserInput = document.querySelector<HTMLInputElement>("#settings-options-ooc-user")!;
	const backupReminderInput = document.querySelector<HTMLInputElement>("#settings-options-backup-reminder")!;
	const cwo = document.querySelector<HTMLInputElement>("#settings-options-cwo")!;
	const miscSave = document.querySelector<HTMLButtonElement>("#settings-misc-save")!;
	const proofreadInput = document.querySelector<HTMLTextAreaElement>("#settings-options-proofread")!;
	const proofreadReset = document.querySelector<HTMLButtonElement>("#settings-options-proofread-reset")!;
	const proofreadDiffInput = document.querySelector<HTMLTextAreaElement>("#settings-options-proofread-diff")!;
	const proofreadDiffReset = document.querySelector<HTMLButtonElement>("#settings-options-proofread-diff-reset")!;
	makeResizable(proofreadInput);
	makeResizable(proofreadDiffInput);
	proofreadReset.addEventListener("click", () => {
		proofreadInput.value = PROOFREAD_DEFAULT_PROMPT;
		proofreadInput.dispatchEvent(new Event("input"));
	});
	proofreadDiffReset.addEventListener("click", () => {
		proofreadDiffInput.value = PROOFREAD_DIFF_DEFAULT_PROMPT;
		proofreadDiffInput.dispatchEvent(new Event("input"));
	});
	
	listen(u => {
		if (u.storage !== "local") return;
		if (u.key !== "settings") return;

		updateSettings();
	});
	updateSettings();

	miscSave.addEventListener("click", () => {
		const settings = loadMiscSettings();
		const tail = parseInt(tailInput.value, 10);
		const cw = parseFloat(cwo.value);
		settings.tail = isNaN(tail) ? 0 : tail;
		settings.remberStretch = remberStretchInput.checked;
		settings.oocAsUser = oocAsUserInput.checked;
		settings.backupReminder = backupReminderInput.checked;
		settings.contentWidthOverride = isNaN(cw) ? 0 : cw;
		settings.proofreadPrompt = proofreadInput.value.trim() || PROOFREAD_DEFAULT_PROMPT;
		settings.proofreadDiffPrompt = proofreadDiffInput.value.trim() || PROOFREAD_DIFF_DEFAULT_PROMPT;

		local.set("settings", JSON.stringify(settings));
		toast("settings updated");
	});

	function updateSettings() {
		const settings = loadMiscSettings();
		tailInput.value = String(settings.tail);
		remberStretchInput.checked = settings.remberStretch;
		oocAsUserInput.checked = settings.oocAsUser;
		backupReminderInput.checked = settings.backupReminder;
		cwo.value = String(settings.contentWidthOverride);
		proofreadInput.value = settings.proofreadPrompt;
		proofreadInput.dispatchEvent(new Event("input"));
		proofreadDiffInput.value = settings.proofreadDiffPrompt;
		proofreadDiffInput.dispatchEvent(new Event("input"));
	}
}

export type MiscSettings = {
	tail: number,
	remberStretch: boolean,
	/** send OOC notes as "OOC: ..." user turns for backends that reject mid-conversation system messages */
	oocAsUser: boolean,
	/** a weekly toast that offers a full backup, see backup.ts */
	backupReminder: boolean,
	contentWidthOverride: number,
	/** system prompt of the scenario editor's proofread section */
	proofreadPrompt: string,
	/** the proofreader asks for corrected text and shows the changes as a diff instead of a list of findings */
	proofreadDiff: boolean,
	/** system prompt of the diff mode, see scenario/proofread-diff.ts */
	proofreadDiffPrompt: string
};
export const PROOFREAD_DEFAULT_PROMPT = [
	"you are a proofreader for roleplay scenario cards. the user sends a character definition and one or more opening messages.",
	"list typos, grammar mistakes, awkward or repetitive phrasing, inconsistencies (names, tense, point of view) and other style problems.",
	"for each one quote the fragment, say what is wrong and suggest a fix. group the findings by section, as a markdown list.",
	"do not rewrite the text as a whole, do not comment on the content, setting or themes, and do not praise. if a section is fine, say so in one line."
].join(" ");
export const PROOFREAD_DIFF_DEFAULT_PROMPT = [
	"you are a proofreader for roleplay scenario cards. the user sends a character definition and one or more opening messages, each wrapped in its own tag like <definition> or <opening_1>.",
	"fix typos, grammar, punctuation, wrong word forms and clearly broken phrasing.",
	"keep everything else exactly as it is: the author's wording and style, formatting, line breaks, markdown, quotes, asterisks and names.",
	"do not rephrase text that is already correct, do not add or remove content, do not change the meaning, tense or point of view.",
	"macros in curly braces are placeholders filled in by the app; keep them exactly as they are.",
	"answer with the full corrected text of every section, wrapped in the same tags and in the same order.",
	"write nothing outside the tags: no comments, no explanations. if a section needs no fixes, return it unchanged.",
	`\n\n${MACROS}`
].join(" ");
const DEFAULT_SETTINGS: MiscSettings = {
	tail: 100,
	remberStretch: true,
	oocAsUser: false,
	backupReminder: true,
	contentWidthOverride: 0,
	proofreadPrompt: PROOFREAD_DEFAULT_PROMPT,
	proofreadDiff: true,
	proofreadDiffPrompt: PROOFREAD_DIFF_DEFAULT_PROMPT
};

export function loadMiscSettings(): MiscSettings {
	const raw = local.get("settings");
	if (!raw) return DEFAULT_SETTINGS;
	const parsed = nothrow(() => JSON.parse(raw));
	if (!parsed.success) return DEFAULT_SETTINGS;

	return {
		...DEFAULT_SETTINGS,
		...parsed.value
	};
}
