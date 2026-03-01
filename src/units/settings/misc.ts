import { listen, local } from "@root/persist";
import { nothrow } from "@root/utils";

export function initMisc() {
	const tailInput = document.querySelector<HTMLInputElement>("#settings-options-tail")!;
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
		settings.tail = isNaN(tail) ? 0 : tail;

		local.set("settings", JSON.stringify(settings));
	});

	function updateSettings() {
		const settings = loadMiscSettings();
		tailInput.value = String(settings.tail);
	}
}

const DEFAULT_SETTINGS = {
	tail: 70
}

export function loadMiscSettings() {
	const raw = local.get("settings");
	if (!raw) return DEFAULT_SETTINGS;
	const parsed = nothrow(() => JSON.parse(raw));
	if (!parsed.success) return DEFAULT_SETTINGS;

	return {
		...DEFAULT_SETTINGS,
		...parsed.value
	} as typeof DEFAULT_SETTINGS;
}
