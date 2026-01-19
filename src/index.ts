import { define as defineRadio }     from "@rampike/radio";
import { define as defineTabs }      from "@rampike/tabs";
import { define as defineModal }     from "@rampike/modal";
import { define as definePages }     from "@rampike/pagination";
import { define as defineSVGImport } from "@rampike/import";
import { define as defineFilePicker} from "@rampike/filepicker";
import { navigationUnit } from "@units/navigation";
import { RampikeUnit }    from "@units/types";
import { settingsUnit }   from "@units/settings";
import { chatUnit }       from "@units/chat";
import { init as initPersist } from "./persist";

defineTabs();
defineRadio();
defineModal("ram-modal");
definePages();
defineSVGImport("ram-import");
defineFilePicker("ram-file-picker");

window.addEventListener("DOMContentLoaded", main);

const units: RampikeUnit[] = [
	navigationUnit,
	settingsUnit,
	chatUnit
];

async function main() {
	units.forEach(u => u.init?.(undefined));

	const dbAvailable = initPersist();
	if (!dbAvailable) alert("indexeddb init failed");
}
