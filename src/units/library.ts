import { getBlobLink, idb, listen, upload } from "@root/persist";
import { RampikeUnit } from "./types";
import { mudcrack } from "rampike";
import { b64Encoder, download, placeholder, renderMD, setSelectOptions } from "@root/utils";
import { RampikeModal } from "@rampike/modal";
import { start } from "./chat/start";
import { ScenarioCard } from "@root/types";
import { RampikeFilePicker } from "@rampike/filepicker";

let openerRelay: {
	scenarioId: string
} | null = null;

export const libraryUnit: RampikeUnit = {
	init: () => {
		const startButton = document.querySelector<HTMLButtonElement>("#library-start-button")!;
		const startPersonaPicker = document.querySelector<HTMLSelectElement>("#library-start-persona")!;
		const importButton = document.querySelector<RampikeFilePicker>("#library-import")!;
		const modal = document.querySelector<RampikeModal>("#library-start")!;

		startButton.addEventListener("click", async () => {
			if (!openerRelay) return;
			const personaId = startPersonaPicker.value;
			if (!personaId) return;
			await start(personaId, openerRelay.scenarioId);
			modal.close();
		});

		importButton.addEventListener("input", () => {
			const file = importButton.input.files?.[0];
			if (!file) return;

			importScenario(file);
		});

		listen(async u => {
			if (u.storage !== "idb") return;
			if (u.store !== "scenarios") return;

			update();
		});
		update();
	}
};

async function update() {
	const list = document.querySelector<HTMLElement>("#library-cards")!;

	list.innerHTML = "";
	const items = await idb.getAll("scenarios");
	if (!items.success) return;

	const contents = items.value.reverse().map(item => {
		let icon = mudcrack({
			tagName: "img",
			attributes: {
				src: placeholder(null)
			}
		});
		if (item.card.picture) {
			getBlobLink(item.card.picture)
				.then(src => { if (src) icon.src = src });
		}
		const description = mudcrack({
			className: "scenario-card-description"
		});
		description.innerHTML = renderMD(item.card.description);
		return mudcrack({
			className: "scenario-card lineout",
			contents: [
				icon,
				mudcrack({
					className: "list",
					contents: [
						mudcrack({
							className: "row-compact",
							contents: [
								mudcrack({
									tagName: "h6",
									contents: item.card.title
								}),
								mudcrack({
									tagName: "button",
									className: "strip ghost pointer",
									events: {
										click: () => downloadScenario(item)
									},
									contents: "⤓"
								}),
								mudcrack({
									tagName: "button",
									className: "strip ghost pointer",
									events: {
										click: () => deleteScenario(item.id, item.card.title)
									},
									contents: "✖"
								}),
								mudcrack({
									tagName: "button",
									className: "strip ghost pointer",
									events: {
										click: () => {
											document.location.hash = `scenario-editor.${item.id}`
										}
									},
									contents: "✎"
								}),
								mudcrack({
									tagName: "button",
									className: "lineout",
									events: {
										click: () => openStartModal(item.id, item.card.description)
									},
									contents: "play"
								})
							]
						}),
						mudcrack({
							tagName: "hr"
						}),
						description,
						mudcrack({
							className: "scenario-card-tags",
							contents: item.card.tags.map(tag =>
								mudcrack({
									tagName: "span",
									className: "pointer",
									contents: tag
								})
							).toReversed()
						})
					]
				})
			]
		})
	});

	list.append(...contents);
	if (contents.length === 0)
		list.append(mudcrack({ className: "placeholder", contents: "No scenario cards found" }));
}

async function downloadScenario(card: ScenarioCard) {
	const payload = { ...card };

	async function encoded(value: string | null) {
		if (!value) return null;
		const icon = await idb.get("media", value)
		if (icon.success)
			return await b64Encoder.encode(icon.value.media);
		else
			return null;
	}

	payload.card.picture = await encoded(card.card.picture);
	payload.chat.picture = await encoded(card.chat.picture);

	const filename = payload.chat.name || payload.card.title || "scenario";
	download(JSON.stringify(payload), `${filename}.json`);
}

async function importScenario(file: File) {
	const raw = await file.text();
	const parsed = JSON.parse(raw);

	console.log(parsed);
	parsed.id = crypto.randomUUID();
	
	async function decode(b64: string | null) {
		if (!b64) return null;
		const file = await b64Encoder.decode(b64);
		const media = await upload(file);
		return media;
	}
	parsed.card.picture = await decode(parsed.card.picture);
	parsed.chat.picture = await decode(parsed.chat.picture);

	idb.set("scenarios", parsed);
}

function deleteScenario(id: string, name: string) {
	const ok = confirm(`scenario "${name}" will be deleted`);
	if (!ok) return;

	idb.del("scenarios", id);
}

async function openStartModal(scenario: string, descriptionMD: string) {
	const modal = document.querySelector<RampikeModal>("#library-start")!;
	const picker = modal.querySelector<HTMLSelectElement>("#library-start-persona")!;
	const description = document.querySelector("#library-start-description")!;
	const placeholder = modal.querySelector<HTMLElement>("#library-start-placeholder")!;
	const noPlaceholder = modal.querySelector<HTMLElement>("#library-start-no-placeholder")!;
	
	const personas = await idb.getAll("personas");
	if (!personas.success) return;
	
	console.log(personas.value.length > 0)
	placeholder.hidden = personas.value.length > 0;
	noPlaceholder.style.display = placeholder.hidden ? "contents" : "none";

	setSelectOptions(
		picker,
		personas.value.map(({id, name}) => [id, name]),
		true
	);

	openerRelay = {
		scenarioId: scenario
	};

	description.innerHTML = renderMD(descriptionMD);

	modal.open();
}
