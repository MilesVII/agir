import { define as defineRadio } from "./components/radio";
import { define as defineTabs } from "./components/tabs";
import { define as defineModal } from "./components/modal";
import { define as definePages } from "./components/pagination";
import { define as defineSVGImport } from "./components/import";
import { define as defineFilePicker} from "./components/filepicker";
import { navigationUnit } from "./units/navigation";
import { RampikeUnit } from "./units/types";
import { settingsUnit } from "./units/settings";
import { chatUnit } from "./units/chat";

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
}
