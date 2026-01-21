import { RampikeTabs } from "@rampike/tabs";
import { RampikeUnit } from "./types";

const backMap = {
	"settings": "chats",
	"library": "chats",
	"play": "chats"
};

export const navigationUnit: RampikeUnit = {
	init: () => {
		const tabs = document.querySelector<RampikeTabs>("ram-tabs#tabs-main")!;
		function nav(to: string) {
			tabs.tab = to;
			window.location.hash = to;
		}
		let oldHistory = window.history.length;

		window.addEventListener("popstate", e => {
			if (oldHistory < window.history.length) {
				oldHistory = window.history.length
				return;
			}
			oldHistory = window.history.length
			e.preventDefault();
			const target = backMap[tabs.tab as keyof typeof backMap];
			if (target) nav(target);
		});

		const hash = window.location.hash.slice(1).split(".");
		if (hash[0]) nav(hash[0]);

		const buttons = document.querySelectorAll<HTMLButtonElement>("button[data-to]");
		buttons.forEach(b => b.addEventListener("click", () => nav(b.dataset.to!)));
	}
}
