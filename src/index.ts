import { define as defineRadio }       from "@rampike/radio";
import { define as defineTabs }        from "@rampike/tabs";
import { define as defineModal }       from "@rampike/modal";
import { define as definePages }       from "@rampike/pagination";
import { define as defineSVGImport }   from "@rampike/import";
import { define as defineFilePicker}   from "@rampike/filepicker";
import { define as defineLabeled }     from "@rampike/fieldset";
import { define as defineImagePicker } from "@rampike/imagepicker";
import { navigationUnit } from "@units/navigation";
import { settingsUnit }   from "@units/settings";
import { chatUnit }       from "@units/chat";
import { mainUnit }       from "@units/main";
import { scenarioUnit }   from "@units/scenario";
import { init as initPersist } from "./persist";
import { libraryUnit } from "@units/library";
import { toast } from "@units/toasts";

defineTabs();
defineRadio();
defineModal("ram-modal");
definePages();
defineSVGImport("ram-import");
defineFilePicker("ram-file-picker");
defineImagePicker("ram-image-picker");
defineLabeled("ram-labeled");

window.addEventListener("DOMContentLoaded", main);

const units: (() => void)[] = [
	navigationUnit,
	settingsUnit,
	chatUnit,
	mainUnit,
	libraryUnit,
	scenarioUnit
];

async function main() {
	units.forEach(u => u());

	const dbAvailable = initPersist();
	if (!dbAvailable) toast("indexeddb init failed");
}
