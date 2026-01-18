import { RampikeUnit } from "./types";
import { initTheme } from "./settings/themes";
import { RampikePicker } from "../components/filepicker";
import { get, set } from "../persist";

export const settingsUnit: RampikeUnit = {
	init: () => {
		initTheme();
		const filePicker = document.querySelector<RampikePicker>("#settings-persona-file")!;
		filePicker.addEventListener("input", () => {
			if (!filePicker.input.files) return;
			const file = filePicker.input.files[0];
			if (!file) return;

			set("media", {
				id: "tete",
				media: file,
				mime: file.type
			});
		});

		document.querySelector<HTMLButtonElement>("#settings-add-persona")?.addEventListener("click", async () => {
			const file = await get("media", "tete");
			if (!file.success) {
				console.error("fuck!");
				return;
			}
			console.log(file.value);
			filePicker.querySelector("img")!.src = URL.createObjectURL(file.value.media);
		})

	}
}
