import { RampikePicker } from "@rampike/filepicker";
import { RampikeUnit } from "@units/types";
import { idb } from "@root/persist";

export const personaUnit: RampikeUnit = {
	init: () => {
		const filePicker = document.querySelector<RampikePicker>("#settings-persona-file")!;
		filePicker.addEventListener("input", () => {
			if (!filePicker.input.files) return;
			const file = filePicker.input.files[0];
			if (!file) return;
	
			idb.set("media", {
				id: "tete",
				media: file,
				mime: file.type
			});
		});
	
		document.querySelector<HTMLButtonElement>("#settings-add-persona")?.addEventListener("click", async () => {
			const file = await idb.get("media", "tete");
			if (!file.success) {
				console.error("fuck!");
				return;
			}
			console.log(file.value);
			filePicker.querySelector("img")!.src = URL.createObjectURL(file.value.media);
		})
	}
	
}