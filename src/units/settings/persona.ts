import { RampikePicker } from "@rampike/filepicker";
import { RampikeUnit } from "@units/types";
import { idb, listen } from "@root/persist";
import { mudcrack } from "rampike";

export const personaUnit: RampikeUnit = {
	init: () => {
		const filePicker = document.querySelector<RampikePicker>("#settings-persona-picture")!;
		const personaPicture = filePicker.querySelector("img")!;
		const clearButton = document.querySelector<HTMLButtonElement>("#settings-persona-picture-clear")!;
		const nameInput = document.querySelector<HTMLInputElement>("#settings-persona-name")!;
		const descInput = document.querySelector<HTMLTextAreaElement>("#settings-persona-desc")!;
		const personaList = document.querySelector<HTMLElement>("#settings-persona-list")!;

		function clear() {
			if (personaPicture.src.startsWith("blob")) {
				URL.revokeObjectURL(personaPicture.src);
				personaPicture.src = "assets/gfx/placeholder.png";
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
		}
		filePicker.addEventListener("input", updatePictureInput);
		clearButton.addEventListener("click", () => {
			filePicker.input.value = "";
			clear();
		});

		document.querySelector<HTMLButtonElement>("#settings-add-persona")?.addEventListener("click", async () => {
			const name = nameInput.value;
			const desc = descInput.value;
			if (!name || !desc) return;

			const file = filePicker.input.files?.[0];
			let picture: string | null = null;
			if (file) {
				picture = crypto.randomUUID();
				await idb.set("media", {
					id: picture,
					media: file,
					mime: file.type
				});
			}

			await idb.set("personas", {
				id: crypto.randomUUID(),
				name,
				description: desc,
				picture
			});

			filePicker.input.value = "";
			clear();
			nameInput.value = "";
			descInput.value = "";
		});

		document.querySelector<HTMLElement>("#settings-persona-form")?.addEventListener("paste", e => {
			const file = e.clipboardData?.files[0];
			if (!file) return;

			e.preventDefault();
			// personaPicture.src = URL.createObjectURL(file);
			// filePicker.input.files![0] = file;

			const container = new DataTransfer();
			container.items.add(file);
			filePicker.input.files = container.files;
			updatePictureInput();
		});

		async function updatePersonaList() {
			const personas = await idb.getAll("personas");
			if (!personas.success) return;
			personaList.innerHTML = "";
			const items = personas.value.map(p => mudcrack({
				tagName: "div",
				contents: p.name
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