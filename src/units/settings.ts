import { enginesUnit } from "./settings/engines";
import { personaUnit } from "./settings/persona";
import { initTheme } from "@units/settings/themes";
import { initBackup } from "./settings/backup";
import { initMisc } from "./settings/misc";

export function settingsUnit() {
	initTheme();
	personaUnit();
	enginesUnit();
	initBackup();
	initMisc();
}
