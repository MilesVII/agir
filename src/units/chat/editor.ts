import { RampikeModal } from "@rampike/modal";
import { makeResizable, textareaReconsider } from "@root/utils";
import { estimateTokenCount } from "tokenx";
import { commitChat, getSession } from "./session";

/** The per-chat copy of the scenario definition */
export function initChatEditor() {
	const saveButton      = document.querySelector<HTMLButtonElement>  ("#play-editor-save")!;
	const resetButton     = document.querySelector<HTMLButtonElement>  ("#play-editor-reset")!;
	const closeButton     = document.querySelector<HTMLButtonElement>  ("#play-editor-close")!;
	const definitionInput = document.querySelector<HTMLTextAreaElement>("#play-editor-definition")!;
	const modal           = document.querySelector<RampikeModal>       ("#play-editor")!;
	makeResizable(definitionInput);

	resetButton.addEventListener("click", fill);
	closeButton.addEventListener("click", () => modal.close());
	saveButton.addEventListener("click", async () => {
		const value = definitionInput.value.trim();
		if (!value) return;
		const session = getSession();
		if (!session) return;

		session.chat.scenario.definition = value;
		session.chat.scenario.tokenCount = estimateTokenCount(value);
		await commitChat(session);
		modal.close();
	});

	function fill() {
		const session = getSession();
		if (!session) return;
		definitionInput.value = session.chat.scenario.definition;
		textareaReconsider(definitionInput);
	}

	return {
		open: () => {
			fill();
			modal.open();
			textareaReconsider(definitionInput);
		}
	};
}
