import { RampikeTabs } from "@rampike/tabs";
import { RampikeUnit } from "./types";

export const navigationUnit: RampikeUnit = {
	init: () => {
		const tabs = document.querySelector<RampikeTabs>("ram-tabs#tabs-main")!;
		function nav(to: string) {
			tabs.tab = to;
			window.location.hash = to;
		}
		function hashPath() {
			return window.location.hash.slice(1).split(".");
		}

		window.addEventListener("hashchange", e => {
			tabs.tab = hashPath()[0] ?? "chats";
		});

		const hash = hashPath();
		if (hash[0]) nav(hash[0]);

		const buttons = document.querySelectorAll<HTMLButtonElement>("button[data-to]");
		buttons.forEach(b => b.addEventListener("click", () => nav(b.dataset.to!)));
	}
}
