import { RampikeUnit } from "./types";
import { initTheme } from "./settings/themes";

export const settingsUnit: RampikeUnit = {
	init: () => {
		initTheme();
	}
}
