import { RampikeTabs } from "@rampike/tabs";
import { RampikeUnit } from "./types";

export const navigationUnit: RampikeUnit = {
	init: () => {
		const tabs = document.querySelector<RampikeTabs>("ram-tabs#tabs-main")!;
		function nav(to: string) {
			tabs.tab = to;
			window.location.hash = to;
		}

		const hash = window.location.hash.slice(1);
		if (hash) nav(hash);

		const buttons = document.querySelectorAll<HTMLButtonElement>("button[data-to]");
		buttons.forEach(b => b.addEventListener("click", () => nav(b.dataset.to!)));
	},
	update: () => {

	}
}