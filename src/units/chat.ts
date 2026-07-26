import { asyncMap, b64Encoder, download, getRoute, makeResizable, renderMD, setSelectMenu, setSelectOptions, updateTitle } from "@root/utils";
import { clearMessageViews, loadMessages } from "./chat/load";
import { RampikeTabs } from "@rampike/tabs";
import { idb, listen, local } from "@root/persist";
import { readActiveProviders, readProviders } from "./settings/providers";
import { sendMessage } from "./chat/send";
import { abortController } from "@root/run";
import { ActiveProviders } from "@root/types";
import { initChatEditor } from "./chat/editor";
import { initRember, updateRemberCounter } from "./chat/rember";
import { toast } from "./toasts";
import { RampikeModal } from "@rampike/modal";
import { chatStore, messagesStore } from "./caching";

export function chatUnit() {
	const scroller       = document.querySelector<HTMLElement>        ("#play-messages")!;
	const textarea       = document.querySelector<HTMLTextAreaElement>("#chat-textarea")!;
	const sendButton     = document.querySelector<HTMLButtonElement>  ("#chat-send-button")!;
	const stopButton     = document.querySelector<HTMLButtonElement>  ("#chat-stop-button")!;
	const remberCounter  = document.querySelector<HTMLButtonElement>  ("#chat-rember-counter")!;
	const providerPicker = document.querySelector<HTMLSelectElement>  ("#chat-provider-picker")!;
	const menuButton     = document.querySelector<HTMLSelectElement>  ("#chat-menu-select")!;
	const inputModes     = document.querySelector<RampikeTabs>        ("#chat-controls")!;
	const previewContainer   = document.querySelector<RampikeModal>("#play-card")!;
	const previewEditButton  = document.querySelector<HTMLElement> ("#play-card-edit")!;
	const previewCloseButton = document.querySelector<HTMLElement> ("#play-card-close")!;

	makeResizable(textarea, scroller);
	window.addEventListener("hashchange", update);
	listen(u => {
		if (u.storage !== "local") return;
		if (u.key !== "providers" && u.key !== "activeProvider") return;
		updateProviders();
	});

	sendButton.addEventListener("click", sendMessage);
	stopButton.addEventListener("click", () => abortController.abort());
	remberCounter.addEventListener("click", openRemberGuarded);
	providerPicker.addEventListener("input", () => { pickMainProvider(providerPicker.value); })
	previewEditButton.addEventListener("click", () => window.open(cardPreviewRelay.url));
	previewCloseButton.addEventListener("click", () => previewContainer.close());

	window.addEventListener("beforeunload", e => {
		const halt = !!textarea.value.trim();
		if (halt) {
			e.preventDefault();
			e.returnValue = "";
		}
	});

	update();
	updateProviders();

	const { open: openChatEditor } = initChatEditor();
	const { open: openRember } = initRember();
	function openRemberGuarded() {
		if (inputModes.tab !== "main") {
			toast("please wait until message generation is over");
			return;
		}
		openRember();
	}
	setSelectMenu(menuButton, "☰", [
		["Scenario card",   openScenarioIfExists],
		["Edit definition", openChatEditor],
		["⧖ rEmber",        openRemberGuarded],
		["Export",          exportChat],
		["Clone",           cloneChat]
	]);
}

async function update() {
	const [page, chatId] = getRoute();
	if (page !== "play") {
		updateTitle(null);
		clearMessageViews();
		return;
	}
	if (!chatId) return;

	await Promise.all([
		chatStore.update(),
		messagesStore.update()
	]);
	await loadMessages(chatId);
	updateRemberCounter();
}

function updateProviders() {
	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;
	const providerPicker = document.querySelector<HTMLSelectElement>("#chat-provider-picker")!;
	const providerControl = document.querySelector<HTMLElement>(".chat-provider-control")!;

	const providerMap = readProviders();

	const providerOptions = Object.entries(providerMap);
	const activeId = providerOptions.find(([, e]) => e.isActive)?.[0];
	setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId || providerOptions[0]?.[0]);

	if (providerOptions.length > 0) {
		if (activeId) {
			providerPicker.value = activeId;
		} else {
			const actives: ActiveProviders = {
				main: providerOptions[0][0],
				rember: null
			};
			local.set("activeProvider", JSON.stringify(actives));
		}
		if (inputModes.tab !== "pending")
			inputModes.tab = "main";
		providerControl.hidden = false;
	} else {
		inputModes.tab = "disabled";
		providerControl.hidden = true;
	}
}

function pickMainProvider(id: string) {
	const old = readActiveProviders();
	old.main = id;
	local.set("activeProvider", JSON.stringify(old));
}

const cardPreviewRelay = {
	url: ""
};
async function openScenarioIfExists() {
	const previewContainer = document.querySelector<RampikeModal>("#play-card")!;
	const preview = document.querySelector<HTMLElement>("#play-card-preview")!;

	const [, chatId] = getRoute();
	if (!chatId) return;
	const chat = await idb.get("chats", chatId);
	if (!chat.success) return;

	const cardId = chat.value.scenario.id;
	const card = await idb.get("scenarios", cardId)
	if (card.success && card.value) {
		cardPreviewRelay.url = `#scenario-editor.${cardId}`;
		const contents = `# ${card.value.card.title}\n${card.value.card.description}`
		preview.innerHTML = renderMD(contents);
		previewContainer.open();
	} else
		toast("Scenario card not found");
}

async function exportChat() {
	const chat = await chatStore.read();
	if (!chat) return;
	const messages = await messagesStore.read();
	if (!messages) return;
	if (chat.id !== messages.id) return;

	const mediaIDs = [
			chat.userPersona.picture,
			chat.scenario.picture
		].filter(id => id) as string[];
	const encodedMedia = await asyncMap(mediaIDs,
		async (id: string) => {
			const picture = await idb.get("media", id);
			if (!picture.success) return null;
			return {
				...picture.value,
				media: await b64Encoder.encode(picture.value.media)
			};
		}
	);

	const payload = {
		chat: chat,
		contents: messages,
		media: encodedMedia.filter(m => m)
	};

	download(JSON.stringify(payload), `${chat.scenario.name}.${chat.id}.aegir.chat.json`);
}

async function cloneChat() {
	const chat = await chatStore.read();
	if (!chat) return;
	const messages = await messagesStore.read();
	if (!messages) return;

	const nid = crypto.randomUUID();
	await Promise.all([
		idb.set("chats", {
			...chat,
			id: nid,
			lastUpdate: Date.now()
		}),
		idb.set("chatContents", {
			...messages,
			id: nid
		})
	]);
	toast("new chat created");
}
