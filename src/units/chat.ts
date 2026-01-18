import { RampikeUnit } from "./types";

export const chatUnit: RampikeUnit = {
	init: () => {
		const textarea = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;
		const initialHeight = 52; //textarea.clientHeight;
		const update = () => {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight)}px`;
		};
		textarea.addEventListener("input", update);
		update();
	}
};
