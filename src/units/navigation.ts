import { RampikeTabs } from "@rampike/tabs";
import { RampikeUnit } from "./types";
import { getRoute } from "@root/utils";

export const navigationUnit: RampikeUnit = {
	init: () => {
		const tabs = document.querySelector<RampikeTabs>("ram-tabs#tabs-main")!;
		function nav(to: string) {
			tabs.tab = to;
			window.location.hash = to;
		}

		window.addEventListener("hashchange", e => {
			tabs.tab = getRoute()[0] ?? "chats";
		});

		const hash = getRoute()[0];
		if (hash) nav(hash);

		const buttons = document.querySelectorAll<HTMLButtonElement>("button[data-to]");
		buttons.forEach(b => b.addEventListener("click", () => nav(b.dataset.to!)));
	}
}
