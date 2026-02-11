import { RampikeModal } from "@rampike/modal";
import { idb, listen } from "@root/persist";
import { getRoute, makeResizable, textareaReconsider } from "@root/utils";

export function initChatEditor() {
	const saveButton = document.querySelector<HTMLButtonElement>("#play-editor-save")!;
	const resetButton = document.querySelector<HTMLButtonElement>("#play-editor-reset")!;
	const closeButton = document.querySelector<HTMLButtonElement>("#play-editor-close")!;
	const definitionInput = document.querySelector<HTMLTextAreaElement>("#play-editor-definition")!;
	const modal = document.querySelector<RampikeModal>("#play-editor")!;
	makeResizable(definitionInput);

	listen(update => {
		if (update.storage !== "idb") return;
		if (update.store !== "chats") return;
		updateDefinition();
	});
	window.addEventListener("hashchange", updateDefinition);
	resetButton.addEventListener("click", updateDefinition);
	updateDefinition();

	async function getChat() {
		const [page, chatId] = getRoute();
		if (page !== "play" || !chatId) return null;
		const chat = await idb.get("chats", chatId);
		if (!chat.success) return null;

		return chat.value;
	}
	async function updateDefinition() {
		const chat = await getChat()!;
		if (!chat) return;
		definitionInput.value = chat.scenario.definition;
		textareaReconsider(definitionInput);
	}

	saveButton.addEventListener("click", async () => {
		const value = definitionInput.value.trim();
		if (!value) return;

		const chat = await getChat();
		if (!chat) return;
		chat.scenario.definition = value;
		await idb.set("chats", chat);

		modal.close();
	});
	closeButton.addEventListener("click", () => {
		modal.close();
	});

	return {
		open: () => {
			modal.open();
			textareaReconsider(definitionInput);
		}
	}
}
