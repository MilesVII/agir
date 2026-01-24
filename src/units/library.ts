import { getBlobLink, idb, listen } from "@root/persist";
import { RampikeUnit } from "./types";
import { mudcrack } from "rampike";
import { placeholder, renderMD } from "@root/utils";

export const libraryUnit: RampikeUnit = {
	init: () => {
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

	const contents = items.value.map(item => {
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
			className: "scenario-card lineout row",
			contents: [
				icon,
				mudcrack({
					className: "list",
					contents: [
						mudcrack({
							className: "row",
							contents: [
								mudcrack({
									tagName: "h6",
									contents: item.card.title
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
										click: () => {
											document.location.hash = `chat.${item.id}`
										}
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
							className: "scenario-card-tags row-wrap",
							contents: item.card.tags.map(tag =>
								mudcrack({
									tagName: "span",
									className: "pointer",
									contents: tag
								})
							)
						})
					]
				})
			]
		})
	});

	list.append(...contents);
}
