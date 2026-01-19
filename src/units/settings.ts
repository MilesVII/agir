import { RampikeUnit } from "./types";
import { initTheme } from "@units/settings/themes";

export const settingsUnit: RampikeUnit = {
	init: () => {
		initTheme();

	}
}
