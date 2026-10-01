import { RampikeModal } from "@rampike/modal";
import { listen, local } from "@root/persist";
import { ChatMessage, RemberSettings } from "@root/types";
import { setSelectOptions } from "@root/utils";
import { readActiveProviders, readProviders } from "@units/settings/providers";
import { toast } from "@units/toasts";
import { cancelJob, runJob } from "./generation";
import { getMessageView } from "./messages";
import { REMBER_DEFAULTS, remberPrompt } from "./prompt";
import { ChatSession, commitChat, commitContents, getSession, onSessionCommit, onSessionReplaced, setRember } from "./session";
import { makeRemberView } from "@views/rember";

/*
⧖ rEmber: rolling state summaries attached to chat messages.
A summary attached to message R describes everything before R. Each run summarizes
the next `stride * 2` messages after the latest summary, keeping the last exchange out.
*/

export function initRember() {
	const modal          = document.querySelector<RampikeModal>       ("#play-rember")!;
	const providerPicker = document.querySelector<HTMLSelectElement>  ("#play-rember-provider-picker")!;
	const strideInput    = document.querySelector<HTMLInputElement>   ("#play-rember-stride")!;
	const promptInput    = document.querySelector<HTMLTextAreaElement>("#play-rember-prompt")!;
	const list           = document.querySelector<HTMLElement>        ("#play-rember-messages")!;
	const buttons = {
		one:   document.querySelector<HTMLButtonElement>("#play-rember-add-one")!,
		stop:  document.querySelector<HTMLButtonElement>("#play-rember-stop")!,
		save:  document.querySelector<HTMLButtonElement>("#play-rember-save")!,
		reset: document.querySelector<HTMLButtonElement>("#play-rember-reset")!,
		close: document.querySelector<HTMLButtonElement>("#play-rember-modal-close")!
	};

	buttons.one.addEventListener("click", runOne);
	buttons.stop.addEventListener("click", cancelJob);
	buttons.save.addEventListener("click", saveSettings);
	buttons.reset.addEventListener("click", resetPrompt);
	buttons.close.addEventListener("click", () => modal.close());
	buttons.stop.hidden = true;
	providerPicker.addEventListener("input", () => {
		const actives = readActiveProviders();
		actives.rember = providerPicker.value;
		local.set("activeProvider", JSON.stringify(actives));
	});

	list.addEventListener("rember:edit", ({ detail }) => {
		const session = getSession();
		if (!session) return;
		if (setRember(session, detail.mid, detail.text)) commitContents(session);
		getMessageView(session.chat.id, detail.mid)?.controls.refresh();
	});
	list.addEventListener("rember:remove", ({ detail, target }) => {
		const session = getSession();
		if (!session) return;
		if (setRember(session, detail.mid, null)) commitContents(session);
		getMessageView(session.chat.id, detail.mid)?.controls.refresh();
		(target as Element).closest("[data-mid]")?.remove();
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

		list.innerHTML = "";
		const views = session.contents.messages
			.filter(m => m.rember)
			.map(m => makeRemberView(m.id, m.rember!))
			.toReversed();
		list.append(...views);
	}

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

		const view = makeRemberView(plan.at);
		view.controls.hideControls();
		list.prepend(view);
		buttons.one.hidden  = true;
		buttons.stop.hidden = false;

		const result = await runJob(
			"rember", provider,
			remberPrompt(session, settings, plan.scope, plan.previousState),
			{ onChunk: chunk => view.controls.appendChunk(chunk) }
		);

		buttons.one.hidden  = false;
		buttons.stop.hidden = true;
		if (!result.success) {
			toast(result.error);
			view.remove();
			return;
		}

		const summary = result.value.trim();
		setRember(session, plan.at, summary);
		await commitContents(session);
		view.controls.setContents(summary);
		getMessageView(session.chat.id, plan.at)?.controls.refresh();
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
	/** message the new summary will be attached to */
	at: number,
	/** messages to summarize */
	scope: ChatMessage[],
	/** the summary being continued, if any */
	previousState: string | null
};

/** Picks the next chunk of messages to summarize, or null when the chat is fully covered */
export function planRember(messages: ChatMessage[], stride: number): RemberPlan | null {
	const candidates = messages.slice(0, -2); // the latest exchange may still be rerolled
	const lastAt = candidates.findLastIndex(m => m.rember);
	const start = lastAt === -1 ? 0 : lastAt;
	const at = Math.min(candidates.length - 1, start + stride * 2);
	if (at <= start) return null;
	return {
		at,
		scope: candidates.slice(start, at),
		previousState: lastAt === -1 ? null : candidates[lastAt].rember
	};
}

export function updateRemberCounter(session: ChatSession | null = getSession()) {
	const counter = document.querySelector<HTMLButtonElement>("#chat-rember-counter")!;
	counter.hidden = true;
	if (!session) return;

	const messages = session.contents.messages;
	const lastRembered = messages.findLastIndex(m => m.rember);
	if (lastRembered === -1) return; // forgor

	const delta = messages.length - 1 - lastRembered;
	counter.textContent = `⧖${delta}`;
	counter.dataset.run = (delta > settingsOf(session).stride * 2) ? "true" : "false";
	counter.hidden = false;
}
