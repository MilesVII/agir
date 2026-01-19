import { enginesUnit } from "./settings/engines";
import { personaUnit } from "./settings/persona";
import { RampikeUnit } from "./types";
import { initTheme } from "@units/settings/themes";

export const settingsUnit: RampikeUnit = {
	init: () => {
		initTheme();
		personaUnit.init!(undefined);
		enginesUnit.init!(undefined);
	}
}
