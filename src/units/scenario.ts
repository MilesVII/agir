import { idb, upload } from "@root/persist";
import { getRoute, makeResizable, nothrowAsync, renderMD, textareaReconsider } from "@root/utils";
import { Lorebook, ScenarioCard } from "@root/types";
import { RampikeFilePicker } from "@rampike/filepicker";
import { parseLorebookFile } from "./library/lorebook";
import { makeLorebookItemView } from "@views/lorebook-item";
import { placeholderView } from "@views/common";
import { RampikeImagePicker } from "@rampike/imagepicker";
import { toast } from "./toasts";
import { estimateTokenCount } from "tokenx";
import { RampikeModal } from "@rampike/modal";
import { optimizeToWEBP } from "@root/optimizer";

const definitionTemplate = [
	"# Characters",
	"## {{char}} ",
	"",
	"## {{user}}",
	"{{persona}}",
	"",
	"# Scenario",
	"",
	"# Instructions",
	"The user is {{user}}, all other characters are played by you"
].join("\n");

export function scenarioUnit() {
	const chatIcon         = document.querySelector<RampikeImagePicker> ("#scenario-chat-picture")!;
	const cardIcon         = document.querySelector<RampikeImagePicker> ("#scenario-card-picture")!;
	const cardTitle        = document.querySelector<HTMLInputElement>   ("#scenario-card-title")!;
	const cardAuthorName   = document.querySelector<HTMLInputElement>   ("#scenario-card-author-name")!;
	const cardAuthorURL    = document.querySelector<HTMLInputElement>   ("#scenario-card-author-url")!;
	const cardDescription  = document.querySelector<HTMLTextAreaElement>("#scenario-description")!;
	const cardTags         = document.querySelector<HTMLTextAreaElement>("#scenario-tags")!;
	const previewModal     = document.querySelector<RampikeModal>       ("#scenario-preview")!;
	const preview          = document.querySelector<HTMLDivElement>     ("#scenario-preview-container")!;
	const previewClose     = document.querySelector<HTMLDivElement>     ("#scenario-preview-close")!;
	const characterName    = document.querySelector<HTMLInputElement>   ("#scenario-character-name")!;
	const definition       = document.querySelector<HTMLTextAreaElement>("#scenario-definition")!;
	const previewButton    = document.querySelector<HTMLButtonElement>  ("#scenario-preview-button")!;
	const submitButton     = document.querySelector<HTMLButtonElement>  ("#scenario-submit-button")!;
	const cloneButton      = document.querySelector<HTMLButtonElement>  ("#scenario-clone-button")!;
	const firstMessage     = document.querySelector<HTMLTextAreaElement>("#scenario-messages")!;
	const lorebookList     = document.querySelector<HTMLElement>        ("#scenario-lorebooks")!;
	const lorebookImport   = document.querySelector<RampikeFilePicker>  ("#scenario-lorebook-import")!;
	makeResizable(cardDescription);
	makeResizable(definition);
	const messagesControl = initFirstMessages();
	/** books attached to the card being edited */
	let lorebooks: Lorebook[] = [];

	lorebookImport.addEventListener("input", async () => {
		const file = lorebookImport.input.files?.[0];
		lorebookImport.input.value = "";
		if (!file) return;
		const parsed = await parseLorebookFile(file);
		if (!parsed.success) {
			toast(parsed.error);
			return;
		}
		if (lorebooks.some(b => b.id === parsed.value.id)) {
			toast("this lorebook is already attached");
			return;
		}
		lorebooks.push(parsed.value);
		renderLorebooks();
	});
	function renderLorebooks() {
		lorebookList.innerHTML = "";
		if (lorebooks.length === 0) lorebookList.append(placeholderView("No lorebooks attached"));
		lorebookList.append(...lorebooks.map(book => makeLorebookItemView(book, {
			toggle: enabled => { book.enabled = enabled; },
			remove: () => {
				lorebooks = lorebooks.filter(b => b !== book);
				renderLorebooks();
			}
		})));
	}

	window.addEventListener("hashchange", load);
	load();

	async function load() {
		const path = getRoute();
		if (path[0] !== "scenario-editor") return;
		cardIcon.usePlaceholder();
		chatIcon.usePlaceholder();
		document.body.scrollTo({ behavior: "instant", top: 0 });
		cloneButton.hidden = !path[1]; // a card that was never saved has nothing to clone

		if (path[1]) {
			const scenario = await idb.get("scenarios", path[1]);
			if (!scenario.success) return;
			cardIcon.value        = scenario.value.card.picture ?? "";
			cardTitle.value       = scenario.value.card.title;
			cardAuthorName.value  = scenario.value.card.author?.name ?? "";
			cardAuthorURL.value   = scenario.value.card.author?.url ?? "";
			cardDescription.value = scenario.value.card.description;
			cardTags.value        = scenario.value.card.tags.join(", ");

			chatIcon.value        = scenario.value.chat.picture ?? "";
			characterName.value   = scenario.value.chat.name;
			definition.value       = scenario.value.chat.definition;

			messagesControl.set(scenario.value.chat.initials);
			lorebooks = scenario.value.lorebooks ?? [];
		} else {
			cardIcon.usePlaceholder();
			cardTitle.value = "";
			cardAuthorName.value = "";
			cardAuthorURL.value = "";
			cardDescription.value = "";
			cardTags.value = "";

			chatIcon.usePlaceholder();
			characterName.value = "";
			definition.value = definitionTemplate;

			messagesControl.set([""]);
			lorebooks = [];
		}
		renderLorebooks();
		textareaReconsider(cardDescription);
		textareaReconsider(definition);
		textareaReconsider(cardTags);
		textareaReconsider(firstMessage);
	}

	submitButton.addEventListener("click", async () => {
		const payload = await buildPayload(getRoute()[1] ?? crypto.randomUUID());
		if (!payload) return;

		await idb.set("scenarios", payload);
		window.location.hash = "library";
	});
	/** Saves what the form holds as a new card and switches the editor to it */
	cloneButton.addEventListener("click", async () => {
		const payload = await buildPayload(crypto.randomUUID());
		if (!payload) return;
		payload.card.title += " (copy)";

		await idb.set("scenarios", payload);
		toast("scenario cloned, you are now editing the copy");
		window.location.hash = `scenario-editor.${payload.id}`;
	});

	/** Validates the form and collects it into a card with the given id, storing freshly picked pictures */
	async function buildPayload(id: string): Promise<ScenarioCard | null> {
		const firstMessages = messagesControl.get();

		type Check = [cb: () => any, msg: string, target?: HTMLElement];
		const checks: Check[] = [
			[() => cardTitle.value, "Card name is required", cardTitle],
			[() => definition.value, "Character definiton is required", definition],
			[() => firstMessages.length > 0, "At least one non-empty opening message is required", firstMessage]
		];
		for (const [cb, msg, target] of checks) {
			if (cb()) continue;

			toast(msg);
			target?.focus({ preventScroll: true });
			target?.scrollIntoView({ behavior: "smooth", block: "center" });
			return null;
		}

		const cardPicture = await storePicture(cardIcon);
		const chatPicture = await storePicture(chatIcon);

		const tags = cardTags.value
			.split(",")
			.map(t => t.trim())
			.filter(t => t);

		function author(): ScenarioCard["card"]["author"] {
			if (cardAuthorName.value.trim()) {
				return {
					name: cardAuthorName.value.trim(),
					url: cardAuthorURL.value.trim() || null
				};
			} else return null;
		}

		const payload: ScenarioCard = {
			id,
			lastUpdate: Date.now(),
			card: {
				picture: cardPicture,
				title: cardTitle.value,
				description: cardDescription.value,
				tags,
				author: author()
			},
			chat: {
				picture: chatPicture,
				name: characterName.value,
				definition: definition.value,
				initials: firstMessages,
				tokenCount: estimateTokenCount(definition.value)
			},
			lorebooks
		};

		if (!payload.chat.definition.includes("{{persona}}")) {
			toast([
				"warning!\nthe saved definition lacks",
				" {{persona}} macro -- meaning the bot",
				" won't be able to know abything about",
				" user's persona"
			].join(""));
		}

		return payload;
	}

	previewClose.addEventListener("click", () => previewModal.close());
	previewButton.addEventListener("click", () => {
		const content = cardDescription.value;
		preview.innerHTML = renderMD(content);
		previewModal.open();
	});
}

function initFirstMessages() {
	const messagesControls        = document.querySelector<HTMLElement>        ("#scenario-messages-clicker")!;
	const messagesControlsButtons = messagesControls.querySelectorAll("button");
	const messagesControlsCaption = messagesControls.querySelector("div")!;
	const messages                = document.querySelector<HTMLTextAreaElement>("#scenario-messages")!;
	const messagesState: string[] = [""];
	const asterizeButton   = document.querySelector<HTMLButtonElement>  ("#scenario-messages-asterize")!;
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
		textareaReconsider(messages);
	}
	messages.addEventListener("input", () => {
		messagesState[messageIndex] = messages.value;
	});
	messagesControlsButtons[0].addEventListener("click", () => clickMessagesPager(-1));
	messagesControlsButtons[1].addEventListener("click", () => clickMessagesPager(+1));
	updateMessagesPager();

	asterizeButton.addEventListener("click", () => {
		const lines = messages.value.trim().split("\n");
		const asterized = lines.map(line => {
			if (line.trim().length === 0) return "";
			return line.replace(
				/(^|"\s)([^"]+)(\s"|$)/gm,
				(_, g0, g1, g2) => `${g0}*${g1}*${g2}`
			);
		});
		messagesState[messageIndex] =
			messages.value =
				asterized.join("\n");
	});

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

async function storePicture(picker: RampikeImagePicker): Promise<string | null> {
	const value = picker.value;
	if (typeof value === "string") return value || null;

	const optimized = await nothrowAsync(optimizeToWEBP(value));
	if (!optimized.success) {
		toast("can't process the picture, the card is saved without it");
		return null;
	}
	const [picture, changed] = optimized.value;
	if (changed) console.log(`optimized delta: ${picture.size - value.size} (negative means win)`);
	return await upload(picture);
}
