import { idb, listen } from "@root/persist";
import { state } from "@root/cachedState";
import { getRoute } from "@root/utils";

// currently opened chat
export const chatStore = state(
	async () => {
		const [page, chatId] = getRoute();
		if (page !== "play" || !chatId) return null;
		const result = await idb.get("chats", chatId);
		return result.success ? result.value : null;
	},
	async (v) => {
		if (!v) return;
		await idb.set("chats", v);
	}
);
// currently opened chat messages
export const messagesStore = state(
	async () => {
		const [page, chatId] = getRoute();
		if (page !== "play" || !chatId) return null;
		const result = await idb.get("chatContents", chatId);
		return result.success ? result.value : null;
	},
	async (v) => {
		if (!v) return;
		await idb.set("chatContents", v);
	}
);

export function cachingUnit() {
	// route changes are managed in chat unit
	// window.addEventListener("hashchange", () => {
	// 	chatStore.update();
	// 	messagesStore.update();
	// });
	listen(u => {
		if (u.storage !== "idb") return;
		if (u.store === "chats")        chatStore.update();
		if (u.store === "chatContents") messagesStore.update();
	});
}
