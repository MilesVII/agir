import { listen, local } from "@root/persist";
import { nothrow } from "@root/utils";

export function initMisc() {
	const tailInput = document.querySelector<HTMLInputElement>("#settings-options-tail")!;
	const miscSave = document.querySelector<HTMLButtonElement>("#settings-misc-save")!;
	const rember = {
		stride:   document.querySelector<HTMLInputElement>("#settings-rember-stride")!,
		prompt:   document.querySelector<HTMLTextAreaElement>("#settings-rember-prompt")!,
		template: document.querySelector<HTMLTextAreaElement>("#settings-rember-template")!,
		save:     document.querySelector<HTMLButtonElement>("#settings-rember-save")!
	};

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
	rember.save.addEventListener("click", () => {
		const settings = loadMiscSettings();
		const stride = parseInt(rember.stride.value, 10);
		settings.remberStride = isNaN(stride) ? 0 : stride;
		settings.remberPrompt = rember.prompt.value.trim();
		settings.remberTemplate = rember.template.value.trim();

		local.set("settings", JSON.stringify(settings));
	});

	function updateSettings() {
		const settings = loadMiscSettings();
		tailInput.value = String(settings.tail);

		rember.stride.value = String(settings.remberStride);
		rember.prompt.value = settings.remberPrompt,
		rember.template.value = settings.remberTemplate;
	}
}

const DEFAULT_SETTINGS = {
	tail: 70,
	remberStride: 0,
	remberPrompt: "",
	remberTemplate: "",
	remberEngine: null as null | string
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
