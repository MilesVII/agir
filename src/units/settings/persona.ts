import { RampikeUnit } from "@units/types";
import { getBlobLink, idb, listen, upload } from "@root/persist";
import { mudcrack } from "rampike";
import { Persona, Pronouns } from "@root/types";
import type { RampikeImagePicker } from "@rampike/imagepicker";
import { placeholder } from "@root/utils";

const PRONOUNS_HE: Pronouns = {
	subjective: "he",
	objective: "him",
	possessiveAdj: "his",
	possessivePro: "his",
	reflexive: "himself"
};
const PRONOUNS_SHE: Pronouns = {
	subjective: "she",
	objective: "her",
	possessiveAdj: "her",
	possessivePro: "hers",
	reflexive: "herself"
};
const PRONOUNS_THEY: Pronouns = {
	subjective: "they",
	objective: "them",
	possessiveAdj: "their",
	possessivePro: "theirs",
	reflexive: "themselves"
};
const pronMap = {
	he: PRONOUNS_HE,
	she: PRONOUNS_SHE,
	they: PRONOUNS_THEY
};

export const personaUnit: RampikeUnit = {
	init: () => {
		const filePicker = document.querySelector<RampikeImagePicker>("#settings-persona-picture")!;
		const nameInput = document.querySelector<HTMLInputElement>("#settings-persona-name")!;
		const descInput = document.querySelector<HTMLTextAreaElement>("#settings-persona-desc")!;
		const pronInput = document.querySelector<HTMLSelectElement>("#settings-persona-pronouns")!;
		const personaList = document.querySelector<HTMLElement>("#settings-persona-list")!;
		const submitButton = document.querySelector<HTMLButtonElement>("#settings-add-persona")!;
		const form = document.querySelector<HTMLElement>("#settings-persona-form")!;
		let editingPersona: Persona | null = null;

		submitButton.addEventListener("click", async () => {
			const name = nameInput.value;
			const desc = descInput.value;
			if (!name || !desc) return;

			const file = filePicker.value;
			
			const picture = typeof file === "string"
				? file || null
				: (await upload(file));

			await idb.set("personas", {
				id: editingPersona?.id ?? crypto.randomUUID(),
				name,
				description: desc,
				pronouns: pronMap[pronInput.value as keyof typeof pronMap],
				picture,
				lastUpdate: Date.now()
			});

			filePicker.usePlaceholder();
			nameInput.value = "";
			descInput.value = "";
			pronInput.value = "they";
			editingPersona = null;
		});

		form.addEventListener("paste", e => {
			const file = e.clipboardData?.files[0];
			if (!file) return;
			e.preventDefault();

			filePicker.paste(file);
		});

		function removePersona(id: string) {
			if (!confirm("confirm deletion")) return;
			return idb.del("personas", id);
		}
		async function startEditing(persona: Persona) {
			editingPersona = persona;
			nameInput.value = persona.name;
			descInput.value = persona.description;
			pronInput.value = persona.pronouns.subjective; // hack
			if (persona.picture) {
				filePicker.value = persona.picture;
			}
			nameInput.scrollIntoView({ behavior: "smooth" });
		}
		async function updatePersonaList() {
			const personas = await idb.getAll("personas");
			if (!personas.success) return;

			personaList.innerHTML = "";
			const items = personas.value.reverse().map(p => mudcrack({
				className: "lineout row settings-persona-item",
				attributes: {
					"data-id": p.id
				},
				contents: [
					mudcrack({
						tagName: "img",
						className: "shadow",
						attributes: {
							src: placeholder(null)
						}
					}),
					mudcrack({
						className: "list settings-persona-item-main",
						contents: [
							mudcrack({
								className: "row-compact",
								contents: [
									mudcrack({
										tagName: "h6",
										contents: p.name
									}),
									mudcrack({
										tagName: "button",
										className: "lineout",
										events: {
											click: () => startEditing(p)
										},
										contents: "edit"
									}),
									mudcrack({
										tagName: "button",
										className: "lineout",
										events: {
											click: () => removePersona(p.id)
										},
										contents: "delete"
									}),
								]
							}),
							mudcrack({
								contents: p.description
							})
						]
					})
				]
			}));

			personas.value.forEach(async ({ picture }, ix) => {
				if (!picture) return;
				const src = await getBlobLink(picture);
				if (src)
					items[ix].querySelector("img")!.src = src;
			});

			if (items.length > 0)
				personaList.append(...items);
			else
				personaList.append(mudcrack({
					className: "placeholder",
					contents: "No personas found"
				}));
		}
		listen(async update => {
			if (update.storage !== "idb") return;
			if (update.store !== "personas") return;

			updatePersonaList();
		});
		updatePersonaList();
	}
}
