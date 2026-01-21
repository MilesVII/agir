import { RampikeUnit } from "@units/types";
import { getBlobLink, idb, listen, upload } from "@root/persist";
import { mudcrack } from "rampike";
import { Persona } from "@root/types";
import type { RampikeImagePicker } from "@rampike/imagepicker";

const PLACHEOLDER = "assets/gfx/placeholder.png";

export const personaUnit: RampikeUnit = {
	init: () => {
		const filePicker = document.querySelector<RampikeImagePicker>("#settings-persona-picture")!;
		const clearButton = document.querySelector<HTMLButtonElement>("#settings-persona-picture-clear")!;
		const nameInput = document.querySelector<HTMLInputElement>("#settings-persona-name")!;
		const descInput = document.querySelector<HTMLTextAreaElement>("#settings-persona-desc")!;
		const personaList = document.querySelector<HTMLElement>("#settings-persona-list")!;
		const submitButton = document.querySelector<HTMLButtonElement>("#settings-add-persona")!;
		const form = document.querySelector<HTMLElement>("#settings-persona-form")!;
		let editingPersona: Persona | null = null;

		function clear() {
			filePicker.usePlaceholder();
			clearButton.hidden = true;
		}
		clearButton.addEventListener("click", () => {
			clear();
		});
		filePicker.onDirty = () => {
			clearButton.hidden = filePicker.value === "";
		};
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
				picture
			});

			filePicker.input.value = "";
			clear();
			nameInput.value = "";
			descInput.value = "";
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
			if (persona.picture) {
				filePicker.value = persona.picture;
			}
			nameInput.scrollIntoView({ behavior: "smooth" });
		}
		async function updatePersonaList() {
			const personas = await idb.getAll("personas");
			if (!personas.success) return;
			const imageLinks = await Promise.all(
				personas.value.map(p =>
					p.picture
						? getBlobLink(p.picture)
						: PLACHEOLDER
				)
			);

			personaList.innerHTML = "";
			const items = personas.value.map((p, ix) => mudcrack({
				className: "lineout row settings-persona-item",
				attributes: {
					"data-id": p.id
				},
				contents: [
					mudcrack({
						tagName: "img",
						className: "shadow",
						attributes: {
							src: imageLinks[ix]!
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