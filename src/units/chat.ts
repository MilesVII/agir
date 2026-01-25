import { getRoute, makeResizable, placeholder, renderMDAsync } from "@root/utils";
import { RampikeUnit } from "./types";
import { loadMessages } from "./chat/load";

export const chatUnit: RampikeUnit = {
	init: () => {
		const textarea = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;
		makeResizable(textarea);
		window.addEventListener("hashchange", update);
		update();
	}
};

function update() {
	const route = getRoute();
	if (route[0] !== "play") return;
	if (!route[1]) return;

	loadMessages(route[1]);
}