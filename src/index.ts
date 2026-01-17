import { define as defineRadio } from "./components/radio";
import { define as defineTabs } from "./components/tabs";
import { define as defineModal } from "./components/modal";
import { define as definePages } from "./components/pagination";
import { navigationUnit } from "./units/navigation";
import { RampikeUnit } from "./units/types";
import { settingsUnit } from "./units/settings";

defineTabs();
defineRadio();
defineModal("ram-modal");
definePages();
window.addEventListener("DOMContentLoaded", main);

const units: RampikeUnit[] = [
	navigationUnit,
	settingsUnit
];

async function main() {
	units.forEach(u => u.init?.(undefined));
}
