import { enginesUnit } from "./settings/engines";
import { personaUnit } from "./settings/persona";
import { RampikeUnit } from "./types";
import { initTheme } from "@units/settings/themes";
import { initBackup } from "./settings/backup";
import { initMisc } from "./settings/misc";

export const settingsUnit: RampikeUnit = {
	init: () => {
		initTheme();
		personaUnit.init!(undefined);
		enginesUnit.init!(undefined);
		initBackup();
		initMisc();
	}
}

