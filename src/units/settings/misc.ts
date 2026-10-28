import { listen, local } from "@root/persist";
import { makeResizable, nothrow } from "@root/utils";
import { toast } from "@units/toasts";

export function initMisc() {
	const tailInput = document.querySelector<HTMLInputElement>("#settings-options-tail")!;
	const remberStretchInput = document.querySelector<HTMLInputElement>("#settings-options-rember-stretch")!;
	const oocAsUserInput = document.querySelector<HTMLInputElement>("#settings-options-ooc-user")!;
	const cwo = document.querySelector<HTMLInputElement>("#settings-options-cwo")!;
	const miscSave = document.querySelector<HTMLButtonElement>("#settings-misc-save")!;
	const proofreadInput = document.querySelector<HTMLTextAreaElement>("#settings-options-proofread")!;
	const proofreadReset = document.querySelector<HTMLButtonElement>("#settings-options-proofread-reset")!;
	makeResizable(proofreadInput);
	proofreadReset.addEventListener("click", () => {
		proofreadInput.value = PROOFREAD_DEFAULT_PROMPT;
		proofreadInput.dispatchEvent(new Event("input"));
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
		settings.contentWidthOverride = isNaN(cw) ? 0 : cw;
		settings.proofreadPrompt = proofreadInput.value.trim() || PROOFREAD_DEFAULT_PROMPT;

		local.set("settings", JSON.stringify(settings));
		toast("settings updated");
	});

	function updateSettings() {
		const settings = loadMiscSettings();
		tailInput.value = String(settings.tail);
		remberStretchInput.checked = settings.remberStretch;
		oocAsUserInput.checked = settings.oocAsUser;
		cwo.value = String(settings.contentWidthOverride);
		proofreadInput.value = settings.proofreadPrompt;
		proofreadInput.dispatchEvent(new Event("input"));
	}
}

export type MiscSettings = {
	tail: number,
	remberStretch: boolean,
	/** send OOC notes as "OOC: ..." user turns for backends that reject mid-conversation system messages */
	oocAsUser: boolean,
	contentWidthOverride: number,
	/** system prompt of the scenario editor's proofread section */
	proofreadPrompt: string
};
export const PROOFREAD_DEFAULT_PROMPT = [
	"you are a proofreader for roleplay scenario cards. the user sends a character definition and one or more opening messages.",
	"list typos, grammar mistakes, awkward or repetitive phrasing, inconsistencies (names, tense, point of view) and other style problems.",
	"for each one quote the fragment, say what is wrong and suggest a fix. group the findings by section, as a markdown list.",
	"do not rewrite the text as a whole, do not comment on the content, setting or themes, and do not praise. if a section is fine, say so in one line."
].join(" ");
const DEFAULT_SETTINGS: MiscSettings = {
	tail: 100,
	remberStretch: true,
	oocAsUser: false,
	contentWidthOverride: 0,
	proofreadPrompt: PROOFREAD_DEFAULT_PROMPT
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
