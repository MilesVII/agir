import { RampikeUnit } from "./types";
import { initTheme } from "./settings/themes";
import { RampikePicker } from "../components/filepicker";

export const settingsUnit: RampikeUnit = {
	init: () => {
		initTheme();
		document.querySelector<RampikePicker>("#settings-persona-file")!.addEventListener("input", console.log)
	}
}
