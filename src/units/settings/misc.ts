import { listen, local } from "@root/persist";
import { nothrow } from "@root/utils";
import { toast } from "@units/toasts";

export function initMisc() {
	const tailInput = document.querySelector<HTMLInputElement>("#settings-options-tail")!;
	const remberStretchInput = document.querySelector<HTMLInputElement>("#settings-options-rember-stretch")!;
	const cwo = document.querySelector<HTMLInputElement>("#settings-options-cwo")!;
	const miscSave = document.querySelector<HTMLButtonElement>("#settings-misc-save")!;
	
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
		settings.contentWidthOverride = isNaN(cw) ? 0 : cw;

		local.set("settings", JSON.stringify(settings));
		toast("settings updated");
	});

	function updateSettings() {
		const settings = loadMiscSettings();
		tailInput.value = String(settings.tail);
		remberStretchInput.checked = settings.remberStretch;
		cwo.value = String(settings.contentWidthOverride);
	}
}

export type MiscSettings = {
	tail: number,
	remberStretch: boolean,
	contentWidthOverride: number
};
const DEFAULT_SETTINGS: MiscSettings = {
	tail: 100,
	remberStretch: true,
	contentWidthOverride: 0
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
