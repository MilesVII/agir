import { idb } from "@root/persist";
import { RampikeUnit } from "./types";
import { getRoute, makeResizable, renderMD, textareaReconsider } from "@root/utils";
import { ScenarioCard } from "@root/types";
import { RampikeImagePicker } from "@rampike/imagepicker";

const definitionTemplate = [
	"# Characters",
	"## {{char}} ",
	"{{char}} is Odin-class coastal defense ship, {{user}}'s roommate.",
	"{{char}} is 79 meters-long, she weighs 3600 tons and is armed with three 24cm SK L/35 guns and eight 8.8cm guns which. she enjoys shooting the latter ones.",
	"## {{user}}",
	"{{user}} is the user. {{persona}}",
	"",
	"# Scenario",
	"{{char}} is taking a bath near the coastline of Gotland, Sweden. {{user}} hails her from the shore"
].join("\n");

export const scenarioUnit: RampikeUnit = {
	init: () => {
		const chatIcon         = document.querySelector<RampikeImagePicker> ("#scenario-chat-picture")!;
		const cardIcon         = document.querySelector<RampikeImagePicker> ("#scenario-card-picture")!;
		const cardTitle        = document.querySelector<HTMLInputElement>   ("#scenario-card-title")!;
		const cardDescription  = document.querySelector<HTMLTextAreaElement>("#scenario-description")!;
		const cardTags         = document.querySelector<HTMLTextAreaElement>("#scenario-tags")!;
		const preview          = document.querySelector<HTMLDivElement>     ("#scenario-preview")!;
		const characterName    = document.querySelector<HTMLInputElement>   ("#scenario-character-name")!;
		const defintion        = document.querySelector<HTMLTextAreaElement>("#scenario-defintion")!;
		const previewButton    = document.querySelector<HTMLButtonElement>  ("#scenario-preview-button")!;
		const submitButton     = document.querySelector<HTMLButtonElement>  ("#scenario-submit-button")!;
		const firstMessage     = document.querySelector<HTMLTextAreaElement>("#scenario-messages")!;
		makeResizable(cardDescription);
		makeResizable(defintion);
		const messagesControl = initFirstMessages()

		window.addEventListener("hashchange", load);
		load();

		async function load() {
			const path = getRoute();
			if (path[0] !== "scenario-editor") return;

			if (path[1]) {
				const scenario = await idb.get("scenarios", path[1]);
				if (!scenario.success) return;
				cardIcon.value = scenario.value.card.picture ?? "";
				cardTitle.value = scenario.value.card.title;
				cardDescription.value = scenario.value.card.description;
				cardTags.value = scenario.value.card.tags.join(", ");

				chatIcon.value = scenario.value.chat.picture ?? "";
				characterName.value = scenario.value.chat.name;
				defintion.value = scenario.value.chat.definition;
				
				messagesControl.set(scenario.value.chat.initials);
			} else {
				cardIcon.usePlaceholder();
				cardTitle.value = "";
				cardDescription.value = "";
				cardTags.value = "";

				chatIcon.usePlaceholder();
				characterName.value = "";
				defintion.value = definitionTemplate;

				messagesControl.set([""]);
			}
			textareaReconsider(cardDescription);
			textareaReconsider(defintion);
			textareaReconsider(cardTags);
			textareaReconsider(firstMessage);
		}

		submitButton.addEventListener("click", async () => {
			const firstMessages = messagesControl.get();
			const required = [
				cardTitle.value,
				defintion.value,
			];
			if (required.some(v => !v) || firstMessages.length <= 0) return;

			const cardPicture = await cardIcon.valueHandle();
			const chatPicture = await chatIcon.valueHandle();
			const tags = cardTags.value.trim().split(",").map(t => t.trim());

			const id = getRoute()[1] ?? crypto.randomUUID();
			const payload: ScenarioCard = {
				id,
				lastUpdate: Date.now(),
				card: {
					picture: cardPicture,
					title: cardTitle.value,
					description: cardDescription.value,
					tags
				},
				chat: {
					picture: chatPicture,
					name: characterName.value,
					definition: defintion.value,
					initials: firstMessages
				}
			};

			await idb.set("scenarios", payload);
			window.location.hash = "library";
		});

		previewButton.addEventListener("click", () => {
			const content = cardDescription.value;
			preview.innerHTML = renderMD(content);
			preview.hidden = false;
		});
	}
}

function initFirstMessages() {
	const messagesControls        = document.querySelector<HTMLElement>        ("#scenario-messages-clicker")!;
	const messagesControlsButtons = messagesControls.querySelectorAll("button");
	const messagesControlsCaption = messagesControls.querySelector("div")!;
	const messages                = document.querySelector<HTMLTextAreaElement>("#scenario-messages")!;
	const messagesState: string[] = [""];
	let messageIndex = 0;

	makeResizable(messages);

	function clickMessagesPager(delta: number) {
		let newIndex = messageIndex + delta;
		if (newIndex < 0) newIndex = messagesState.length - 1;
		else if (newIndex >= messagesState.length) {
			if (messagesState[messageIndex].trim()) {
				messagesState.push("");
			} else {
				newIndex = 0;
			}
		}
		messageIndex = newIndex;
		updateMessagesPager();
	}
	function updateMessagesPager() {
		messagesControlsCaption.textContent = `${messageIndex + 1}/${messagesState.length}`;
		messages.value = messagesState[messageIndex];
	}
	messages.addEventListener("input", () => {
		messagesState[messageIndex] = messages.value;
	});
	messagesControlsButtons[0].addEventListener("click", () => clickMessagesPager(-1));
	messagesControlsButtons[1].addEventListener("click", () => clickMessagesPager(+1));
	updateMessagesPager();

	return {
		set: (values: string[]) => {
			messagesState.splice(0, messagesState.length);
			messagesState.push(...values);
			messageIndex = 0;
			messages.value = messagesState[messageIndex];
			updateMessagesPager();
		},
		get: () => {
			return messagesState.map(v => v.trim()).filter(v => v);
		}
	};
}
