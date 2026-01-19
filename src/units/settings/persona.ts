import { RampikePicker } from "@rampike/filepicker";
import { RampikeUnit } from "@units/types";
import { getBlobLink, idb, listen } from "@root/persist";
import { mudcrack } from "rampike";
import { Persona } from "@root/types";

const PLACHEOLDER = "assets/gfx/placeholder.png";

export const personaUnit: RampikeUnit = {
	init: () => {
		const filePicker = document.querySelector<RampikePicker>("#settings-persona-picture")!;
		const personaPicture = filePicker.querySelector("img")!;
		const clearButton = document.querySelector<HTMLButtonElement>("#settings-persona-picture-clear")!;
		const nameInput = document.querySelector<HTMLInputElement>("#settings-persona-name")!;
		const descInput = document.querySelector<HTMLTextAreaElement>("#settings-persona-desc")!;
		const personaList = document.querySelector<HTMLElement>("#settings-persona-list")!;
		const submitButton = document.querySelector<HTMLButtonElement>("#settings-add-persona")!;
		const form = document.querySelector<HTMLElement>("#settings-persona-form")!;
		let editingPersonaID: string | null = null;
		let editingPersonaPicture: string | null = null;
		let editingPersonaPictureChanged = false;

		function clear() {
			if (personaPicture.src.startsWith("blob")) {
				URL.revokeObjectURL(personaPicture.src);
				personaPicture.src = PLACHEOLDER;
				clearButton.hidden = true;
			}
		}
		function updatePictureInput() {
			clearButton.hidden = true;
			if (!filePicker.input.files) return;
			const file = filePicker.input.files[0];
			if (!file) return;
			if (!file.type.startsWith("image/")) return;

			clear();
			personaPicture.src = URL.createObjectURL(file);
			clearButton.hidden = false;
			if (editingPersonaID) editingPersonaPictureChanged = true;
		}
		filePicker.addEventListener("input", updatePictureInput);
		clearButton.addEventListener("click", () => {
			filePicker.input.value = "";
			clear();
		});
		submitButton.addEventListener("click", async () => {
			const name = nameInput.value;
			const desc = descInput.value;
			if (!name || !desc) return;
			const editing = Boolean(editingPersonaID);

			const file = filePicker.input.files?.[0];
			let picture: string | null = editing ? editingPersonaPicture : null;
			if (file && (editing == editingPersonaPictureChanged)) {
				picture = crypto.randomUUID();
				await idb.set("media", {
					id: picture,
					media: file,
					mime: file.type
				});
			}

			await idb.set("personas", {
				id: editingPersonaID ?? crypto.randomUUID(),
				name,
				description: desc,
				picture
			});

			filePicker.input.value = "";
			clear();
			nameInput.value = "";
			descInput.value = "";
			editingPersonaID = null;
			editingPersonaPicture = null;
			editingPersonaPictureChanged = false;
		});

		form.addEventListener("paste", e => {
			const file = e.clipboardData?.files[0];
			if (!file) return;

			e.preventDefault();

			const container = new DataTransfer();
			container.items.add(file);
			filePicker.input.files = container.files;
			updatePictureInput();
		});

		function removePersona(id: string) {
			if (!confirm("confirm deletion")) return;
			return idb.del("personas", id);
		}
		async function startEditing(persona: Persona) {
			editingPersonaID = persona.id;
			editingPersonaPicture = persona.picture;
			nameInput.value = persona.name;
			descInput.value = persona.description;
			personaPicture.src = persona.picture
				? (await getBlobLink(persona.picture))!
				: PLACHEOLDER;
			editingPersonaPictureChanged = false;
			clearButton.hidden = !persona.picture;
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
			personaList.append(...items);
		}
		listen(async update => {
			if (update.storage !== "idb") return;
			if (update.store !== "personas") return;

			updatePersonaList();
		});
		updatePersonaList();
	}
}