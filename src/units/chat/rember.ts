import { RampikeModal } from "@rampike/modal";
import { listen, local } from "@root/persist";
import { ChatMessage, RemberSettings } from "@root/types";
import { setSelectOptions } from "@root/utils";
import { readActiveProviders, readProviders } from "@units/settings/providers";
import { toast } from "@units/toasts";
import { runJob } from "./generation";
import { ensureRemberView, getMessageView, getSystemView, scrollToMessage } from "./messages";
import { REMBER_DEFAULTS, remberPrompt } from "./prompt";
import { ChatSession, commitChat, commitContents, getSession, messageByID, onSessionCommit, onSessionReplaced, setRember } from "./session";

/*
⧖ rEmber: rolling state summaries attached to chat messages.
A summary attached to message R describes everything before R and is shown right above R
in the chat. Each run summarizes the next `stride * 2` story messages after the latest summary,
keeping the last exchange out. The dialog only holds the settings and a shortcut to the latest summary.
*/

export function initRember() {
	const modal          = document.querySelector<RampikeModal>       ("#play-rember")!;
	const providerPicker = document.querySelector<HTMLSelectElement>  ("#play-rember-provider-picker")!;
	const strideInput    = document.querySelector<HTMLInputElement>   ("#play-rember-stride")!;
	const promptInput    = document.querySelector<HTMLTextAreaElement>("#play-rember-prompt")!;
	const latest = {
		container: document.querySelector<HTMLElement>("#play-rember-latest")!,
		caption:   document.querySelector<HTMLElement>("#play-rember-latest-caption")!,
		text:      document.querySelector<HTMLElement>("#play-rember-latest-text")!
	};
	const buttons = {
		one:   document.querySelector<HTMLButtonElement>("#play-rember-add-one")!,
		save:  document.querySelector<HTMLButtonElement>("#play-rember-save")!,
		reset: document.querySelector<HTMLButtonElement>("#play-rember-reset")!,
		close: document.querySelector<HTMLButtonElement>("#play-rember-modal-close")!
	};
	/** message the latest summary is attached to */
	let latestMid: number | null = null;

	buttons.one.addEventListener("click", runOne);
	buttons.save.addEventListener("click", saveSettings);
	buttons.reset.addEventListener("click", resetPrompt);
	buttons.close.addEventListener("click", () => modal.close());
	latest.container.addEventListener("click", () => {
		const session = getSession();
		if (!session || latestMid === null) return;
		modal.close();
		ensureRemberView(session.chat.id, latestMid);
		scrollToMessage(session.chat.id, latestMid);
	});
	providerPicker.addEventListener("input", () => {
		const actives = readActiveProviders();
		actives.rember = providerPicker.value;
		local.set("activeProvider", JSON.stringify(actives));
	});

	listen(u => {
		if (u.storage !== "local" || u.key !== "activeProvider") return;
		updateProviderPicker();
	});
	updateProviderPicker();

	onSessionReplaced(updateRemberCounter);
	onSessionCommit(session => {
		if (session === getSession()) updateRemberCounter(session);
	});

	function updateProviderPicker() {
		const providerOptions = Object.entries(readProviders());
		const activeId = providerOptions.find(([, e]) => e.remberActive)?.[0];
		setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId);
	}

	function fill(session: ChatSession) {
		const settings = settingsOf(session);
		strideInput.value = String(settings.stride);
		promptInput.value = settings.prompt;

		const message = session.contents.messages.findLast(m => m.rember);
		latestMid = message?.id ?? null;
		latest.container.hidden = !message;
		latest.caption.textContent = message ? `latest summary, attached to message #${message.id}` : "";
		latest.text.textContent = message?.rember ?? "";
	}

	/** Summarizes the next chunk, streaming into the summary's view in the chat */
	async function runOne() {
		const session = getSession();
		if (!session) return;
		const provider = readProviders()[providerPicker.value];
		if (!provider) {
			toast("pick a provider for rEmber first");
			return;
		}
		const settings = readSettingsInputs();
		const plan = planRember(session.contents.messages, settings.stride);
		if (!plan) {
			toast("nothing left to summarize");
			return;
		}

		const chatId = session.chat.id;
		const hadSummary = !!messageByID(session, plan.at)?.rember;
		modal.close();
		ensureRemberView(chatId, plan.at)?.controls.startStreaming();
		scrollToMessage(chatId, plan.at);

		// views are looked up per chunk: the list may be re-rendered mid-stream
		const result = await runJob(
			"rember", provider,
			remberPrompt(session, settings, plan.scope, plan.previousState),
			{ onChunk: chunk => getSystemView(chatId, plan.at, true)?.controls.appendChunk(chunk) }
		);

		if (!result.success) {
			toast(result.error);
			const view = getSystemView(chatId, plan.at, true);
			if (hadSummary) view?.controls.endStreaming();
			else view?.remove();
			return;
		}

		setRember(session, plan.at, result.value.trim());
		await commitContents(session);
		getSystemView(chatId, plan.at, true)?.controls.endStreaming();
		getMessageView(chatId, plan.at)?.controls.refresh();
	}

	async function saveSettings() {
		const session = getSession();
		if (!session) return;
		session.chat.rember = readSettingsInputs();
		await commitChat(session);
		const details = strideInput.closest("details");
		if (details) details.open = false;
	}
	function resetPrompt() {
		if (!confirm("the current rember prompt will be lost after saving the settings")) return;
		promptInput.value = REMBER_DEFAULTS.prompt;
	}
	function readSettingsInputs(): RemberSettings {
		const stride = parseInt(strideInput.value, 10);
		return {
			prompt: promptInput.value.trim(),
			stride: isNaN(stride) ? REMBER_DEFAULTS.stride : stride
		};
	}

	return {
		open: () => {
			const session = getSession();
			if (!session) return;
			fill(session);
			modal.open();
		}
	};
}

// HACK: chats created before rEmber have no settings; drop the fallback after migrations
function settingsOf(session: ChatSession): RemberSettings {
	return session.chat.rember ?? REMBER_DEFAULTS;
}

export type RemberPlan = {
	/** id of the message the new summary will be attached to */
	at: number,
	/** messages to summarize */
	scope: ChatMessage[],
	/** the summary being continued, if any */
	previousState: string | null
};

/**
 * Picks the next chunk of story messages to summarize, or null when the chat is fully covered.
 * OOC notes don't count: they instruct the model and are not part of the roleplay state.
 */
export function planRember(messages: ChatMessage[], stride: number): RemberPlan | null {
	const lastModel = messages.findLastIndex(m => m.from === "model");
	const story = messages
		.slice(0, Math.max(0, lastModel - 1)) // the latest exchange may still be rerolled
		.filter(m => m.from !== "system");

	const lastAt = story.findLastIndex(m => m.rember);
	const start = lastAt === -1 ? 0 : lastAt;
	const at = Math.min(story.length - 1, start + stride * 2);
	if (at <= start) return null;
	return {
		at: story[at].id,
		scope: story.slice(start, at),
		previousState: lastAt === -1 ? null : story[lastAt].rember
	};
}

export function updateRemberCounter(session: ChatSession | null = getSession()) {
	const counter = document.querySelector<HTMLButtonElement>("#chat-rember-counter")!;
	counter.hidden = true;
	if (!session) return;

	const story = session.contents.messages.filter(m => m.from !== "system");
	const lastRembered = story.findLastIndex(m => m.rember);
	if (lastRembered === -1) return; // forgor

	const delta = story.length - 1 - lastRembered;
	counter.textContent = `⧖${delta}`;
	counter.dataset.run = (delta > settingsOf(session).stride * 2) ? "true" : "false";
	counter.hidden = false;
}
