import { asyncMap, b64Encoder, download, getRoute, makeResizable, renderMD, setSelectMenu, setSelectOptions, textareaReconsider, updateTitle } from "@root/utils";
import { RampikeTabs } from "@rampike/tabs";
import { RampikeModal } from "@rampike/modal";
import { idb, listen, local } from "@root/persist";
import { ActiveProviders } from "@root/types";
import { readActiveProviders, readProviders } from "./settings/providers";
import { toast } from "./toasts";
import { initChatEditor } from "./chat/editor";
import { initRember } from "./chat/rember";
import { initMessageList, renderMessages, sendMessage } from "./chat/messages";
import { activeJob, cancelJob, onJobChange } from "./chat/generation";
import { getSession, onSessionReplaced, openSession } from "./chat/session";

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
	initMessageList();
	const editor = initChatEditor();
	const rember = initRember();

	window.addEventListener("hashchange", update);
	listen(u => {
		if (u.storage !== "local") return;
		if (u.key !== "providers" && u.key !== "activeProvider") return;
		updateProviders();
	});
	onSessionReplaced(session => {
		renderMessages(session);
		if (session) updateTitle(session.chat.scenario.name);
	});
	onJobChange(kind => {
		if (inputModes.tab === "disabled") return;
		inputModes.tab = kind ? "pending" : "main";
	});

	sendButton.addEventListener("click", send);
	stopButton.addEventListener("click", cancelJob);
	remberCounter.addEventListener("click", rember.open);
	scroller.addEventListener("message:rember", rember.open);
	providerPicker.addEventListener("input", () => pickMainProvider(providerPicker.value));
	previewEditButton.addEventListener("click", () => window.open(cardPreviewRelay.url));
	previewCloseButton.addEventListener("click", () => previewContainer.close());

	window.addEventListener("beforeunload", e => {
		const halt = !!textarea.value.trim();
		if (halt) {
			e.preventDefault();
			e.returnValue = "";
		}
	});

	setSelectMenu(menuButton, "☰", [
		["Scenario card",   openScenarioIfExists],
		["Edit definition", editor.open],
		["⧖ rEmber",        rember.open],
		["Export",          exportChat],
		["Clone",           cloneChat]
	]);

	update();
	updateProviders();

	async function send() {
		const text = textarea.value.trim();
		if (!text) return;
		if (await sendMessage(text)) {
			textarea.value = "";
			textareaReconsider(textarea);
		}
	}
}

async function update() {
	const [page, chatId] = getRoute();
	if (page !== "play") {
		updateTitle(null);
		return;
	}
	if (!chatId) return;
	// coming back to a chat that is still generating: keep the live session and its views
	if (activeJob() && getSession()?.chat.id === chatId) return;

	await openSession(chatId);
}

function updateProviders() {
	const inputModes = document.querySelector<RampikeTabs>("#chat-controls")!;
	const providerPicker = document.querySelector<HTMLSelectElement>("#chat-provider-picker")!;
	const providerControl = document.querySelector<HTMLElement>(".chat-provider-control")!;

	const providerOptions = Object.entries(readProviders());
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
		inputModes.tab = activeJob() ? "pending" : "main";
		providerControl.hidden = false;
	} else {
		inputModes.tab = "disabled";
		providerControl.hidden = true;
	}
}

function pickMainProvider(id: string) {
	const actives = readActiveProviders();
	actives.main = id;
	local.set("activeProvider", JSON.stringify(actives));
}

const cardPreviewRelay = {
	url: ""
};
async function openScenarioIfExists() {
	const previewContainer = document.querySelector<RampikeModal>("#play-card")!;
	const preview = document.querySelector<HTMLElement>("#play-card-preview")!;

	const session = getSession();
	if (!session) return;

	const cardId = session.chat.scenario.id;
	const card = await idb.get("scenarios", cardId);
	if (card.success && card.value) {
		cardPreviewRelay.url = `#scenario-editor.${cardId}`;
		const contents = `# ${card.value.card.title}\n${card.value.card.description}`;
		preview.innerHTML = renderMD(contents);
		previewContainer.open();
	} else
		toast("Scenario card not found");
}

async function exportChat() {
	const session = getSession();
	if (!session) return;
	const { chat, contents } = session;

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
		chat,
		contents,
		media: encodedMedia.filter(m => m)
	};

	download(JSON.stringify(payload), `${chat.scenario.name}.${chat.id}.aegir.chat.json`);
}

async function cloneChat() {
	const session = getSession();
	if (!session) return;
	const nid = crypto.randomUUID();
	await Promise.all([
		idb.set("chats", {
			...session.chat,
			id: nid,
			lastUpdate: Date.now()
		}),
		idb.set("chatContents", {
			...session.contents,
			id: nid
		})
	]);
	toast("new chat created");
}
