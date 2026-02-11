import { getRoute, makeResizable, setSelectMenu, setSelectOptions } from "@root/utils";
import { RampikeUnit } from "./types";
import { loadMessages } from "./chat/load";
import { RampikeTabs } from "@rampike/tabs";
import { idb, listen, local } from "@root/persist";
import { readActiveEngines, readEngines } from "./settings/engines";
import { sendMessage } from "./chat/send";
import { abortController } from "@root/run";
import { ActiveEngines } from "@root/types";
import { initChatEditor } from "./chat/editor";

export const chatUnit: RampikeUnit = {
	init: () => {
		const textarea     = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;
		const sendButton   = document.querySelector<HTMLButtonElement>("#chat-send-button")!;
		const stopButton   = document.querySelector<HTMLButtonElement>("#chat-stop-button")!;
		const enginePicker = document.querySelector<HTMLSelectElement>("#chat-engine-picker")!;
		const menuButton   = document.querySelector<HTMLSelectElement>("#chat-menu-select")!;

		makeResizable(textarea);
		window.addEventListener("hashchange", update);
		listen(u => {
			if (u.storage !== "local") return;
			if (u.key !== "engines" && u.key !== "activeEngine") return;
			updateEngines();
		});

		sendButton.addEventListener("click", sendMessage);
		stopButton.addEventListener("click", () => abortController.abort());
		enginePicker.addEventListener("input", () => { pickMainEngine(enginePicker.value); })

		update();
		updateEngines();

		const { open: openChatEditor } = initChatEditor();
		setSelectMenu(menuButton, "menu", [
			["Scenario card", async () => {
				const [, chatId] = getRoute();
				if (!chatId) return;
				const chat = await idb.get("chats", chatId);
				if (!chat.success) return;

				const cardId = chat.value.scenario.id;
				if (await idb.get("scenarios", cardId))
					window.open(`#scenario-editor.${cardId}`);
			}],
			["Edit definition", openChatEditor],
			["rEmber", () => {}]
		]);
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
	const enginePicker = document.querySelector<HTMLSelectElement>("#chat-engine-picker")!;
	const engineControl = document.querySelector<HTMLElement>(".chat-engine-control")!;

	const engineMap = readEngines();

	const engineOptions = Object.entries(engineMap);
	const activeId = engineOptions.find(([, e]) => e.isActive)?.[0];
	setSelectOptions(enginePicker, engineOptions.map(([id, e]) => [id, e.name]), !activeId);

	if (engineOptions.length > 0) {
		if (activeId) {
			enginePicker.value = activeId;
		} else {
			const actives: ActiveEngines = {
				main: engineOptions[0][0],
				rember: null
			};
			local.set("activeEngine", JSON.stringify(actives));
		}
		inputModes.tab = "main";
		engineControl.hidden = false;
	} else {
		inputModes.tab = "disabled";
		engineControl.hidden = true;
	}
}

function pickMainEngine(id: string) {
	const old = readActiveEngines();
	old.main = id;
	local.set("activeEngine", JSON.stringify(old));
}
