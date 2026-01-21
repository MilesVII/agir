import { makeResizable } from "@root/utils";
import { RampikeUnit } from "./types";

export const chatUnit: RampikeUnit = {
	init: () => {
		const textarea = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;
		makeResizable(textarea);
	}
};
