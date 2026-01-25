import { getRoute, makeResizable } from "@root/utils";
import { RampikeUnit } from "./types";
import { loadMessages } from "./chat/load";
import { RampikeTabs } from "@rampike/tabs";
import { listen } from "@root/persist";
import { readEngines } from "./settings/engines";
import { sendMessage } from "./chat/send";

export const chatUnit: RampikeUnit = {
	init: () => {
		const textarea = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;
		const sendButton = document.querySelector<HTMLElement>("#chat-send-button")!;

		makeResizable(textarea);
		window.addEventListener("hashchange", update);
		listen(u => {
			if (u.storage !== "local") return;
			if (u.key !== "engines") return;
			updateEngines();
		});
		sendButton.addEventListener("click", sendMessage);

		update();
		updateEngines();
	}
};

async function update() {
	const route = getRoute();
	if (route[0] !== "play") return;
	if (!route[1]) return;

	await loadMessages(route[1]);
}

function updateEngines() {
	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;

	const engineMap = readEngines();

	const engineOptions = Object.entries(engineMap);
	if (engineOptions.length > 0)
		inputModes.tab = "main";
	else
		inputModes.tab = "disabled";
}
