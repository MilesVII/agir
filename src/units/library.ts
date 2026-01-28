import { getBlobLink, idb, listen } from "@root/persist";
import { RampikeUnit } from "./types";
import { mudcrack } from "rampike";
import { placeholder, renderMD, setSelectOptions } from "@root/utils";
import { RampikeModal } from "@rampike/modal";
import { start } from "./chat/start";

let openerRelay: {
	scenarioId: string
} | null = null;

export const libraryUnit: RampikeUnit = {
	init: () => {
		const startButton = document.querySelector<HTMLButtonElement>("#library-start-button")!;
		const startPersonaPicker = document.querySelector<HTMLSelectElement>("#library-start-persona")!;
		const modal = document.querySelector<RampikeModal>("#library-start")!;

		startButton.addEventListener("click", async () => {
			if (!openerRelay) return;
			const personaId = startPersonaPicker.value;
			if (!personaId) return;
			await start(personaId, openerRelay.scenarioId);
			modal.close();
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
									className: "lineout",
									events: {
										click: () => deleteScenario(item.id, item.card.title)
									},
									contents: "delete"
								}),
								mudcrack({
									tagName: "button",
									className: "lineout",
									events: {
										click: () => {
											document.location.hash = `scenario-editor.${item.id}`
										}
									},
									contents: "edit"
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

	const personas = await idb.getAll("personas");
	if (!personas.success) return;

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
