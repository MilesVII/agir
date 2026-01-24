import { RampikeTabs } from "@rampike/tabs";
import { RampikeUnit } from "./types";
import { getRoute } from "@root/utils";

export const navigationUnit: RampikeUnit = {
	init: () => {
		const tabs = document.querySelector<RampikeTabs>("ram-tabs#tabs-main")!;
		function nav(to: string) {
			window.location.hash = to;
		}
		function readHash() {
			tabs.tab = getRoute()[0] ?? "chats";
		}

		window.addEventListener("hashchange", readHash);
		readHash();

		// const hash = getRoute()[0];
		// if (hash) nav(hash);

		const buttons = document.querySelectorAll<HTMLButtonElement>("button[data-to]");
		buttons.forEach(b => b.addEventListener("click", () => nav(b.dataset.to!)));
	}
}
