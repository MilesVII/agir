import { idb, upload } from "@root/persist";
import { RampikeUnit } from "./types";
import { getRoute, makeResizable } from "@root/utils";
import { ScenarioCard } from "@root/types";
import { RampikeImagePicker } from "@rampike/imagepicker";

export const scenarioUnit: RampikeUnit = {
	init: () => {
		const chatIcon        = document.querySelector<RampikeImagePicker> ("#scenario-chat-picture")!;
		const cardIcon        = document.querySelector<RampikeImagePicker> ("#scenario-card-picture")!;
		const cardTitle       = document.querySelector<HTMLInputElement>   ("#scenario-card-title")!;
		const cardDescription = document.querySelector<HTMLTextAreaElement>("#scenario-description")!;
		const characterName   = document.querySelector<HTMLInputElement>   ("#scenario-character-name")!;
		const defintion       = document.querySelector<HTMLTextAreaElement>("#scenario-defintion")!;
		const previewButton   = document.querySelector<HTMLButtonElement>  ("#scenario-preview-button")!;
		const submitButton    = document.querySelector<HTMLButtonElement>  ("#scenario-submit-button")!;
		makeResizable(cardDescription);
		makeResizable(defintion);

		window.addEventListener("hashchange", async () => {
			const path = getRoute();
			if (path[0] !== "scenario-editor") return;
			if (path[1]) {
				const scenario = await idb.get("scenarios", path[1]);
				if (!scenario.success) return;
				cardIcon.value = scenario.value.card.picture ?? "";
				cardTitle.value = scenario.value.card.title;
				cardDescription.value = scenario.value.card.description;
				
				chatIcon.value = scenario.value.chat.picture ?? "";
				characterName.value = scenario.value.chat.name;
				defintion.value = scenario.value.chat.definition;
			} else {
				cardIcon.value = "";
				cardTitle.value = "";
				cardDescription.value = "";
				
				chatIcon.value = "";
				characterName.value = "";
				defintion.value = "";
			}
		});

		submitButton.addEventListener("click", async () => {
			const required = [
				cardTitle.value,
				defintion.value
			];
			if (required.some(v => !v)) return;

			const cardPicture = await cardIcon.valueHandle();
			const chatPicture = await chatIcon.valueHandle();

			const id = getRoute()[1] ?? crypto.randomUUID();
			const payload: ScenarioCard = {
				id,
				card: {
					picture: cardPicture,
					title: cardTitle.value,
					description: cardDescription.value
				},
				chat: {
					picture: chatPicture,
					name: characterName.value || cardTitle.value,
					definition: defintion.value
				}
			};

			await idb.set("scenarios", payload);
			window.location.hash = "library";
		});
	}
}
