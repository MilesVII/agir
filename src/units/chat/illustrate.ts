import { RampikeModal } from "@rampike/modal";
import { renderImage } from "@root/comfy";
import { optimizeToWEBP } from "@root/optimizer";
import { getBlobLink, idb, listen, local, revokeBlobLink, upload } from "@root/persist";
import { Illustration, IllustrateSettings, Provider } from "@root/types";
import { setSelectOptions } from "@root/utils";
import { loadIllustrateConfig } from "@units/settings/illustrate";
import { readActiveProviders, readProviders } from "@units/settings/providers";
import { toast } from "@units/toasts";
import { cancelJob, runJob } from "./generation";
import { getMessageView } from "./messages";
import { ILLUSTRATE_DEFAULTS, sceneSummaryPrompt, sceneTagsPrompt } from "./prompt";
import { ChatSession, commitChat, commitContents, getSession, lastMessage, setIllustration } from "./session";

/*
🖼 Illustrate: scene summary (LLM) -> image prompt (LLM) -> ComfyUI render -> attached to the last message.
Each step can be run on its own and its output edited before the next one.
*/

export function initIllustrate() {
	const modal          = document.querySelector<RampikeModal>       ("#play-illustrate")!;
	const providerPicker = document.querySelector<HTMLSelectElement>  ("#play-illustrate-provider-picker")!;
	const prompts = {
		summary: document.querySelector<HTMLTextAreaElement>("#play-illustrate-summary-prompt")!,
		tags:    document.querySelector<HTMLTextAreaElement>("#play-illustrate-tags-prompt")!
	};
	const outputs = {
		summary: document.querySelector<HTMLTextAreaElement>("#play-illustrate-summary")!,
		tags:    document.querySelector<HTMLTextAreaElement>("#play-illustrate-tags")!
	};
	const buttons = {
		summarize: document.querySelector<HTMLButtonElement>("#play-illustrate-summarize")!,
		compose:   document.querySelector<HTMLButtonElement>("#play-illustrate-compose")!,
		render:    document.querySelector<HTMLButtonElement>("#play-illustrate-render")!,
		all:       document.querySelector<HTMLButtonElement>("#play-illustrate-all")!,
		stop:      document.querySelector<HTMLButtonElement>("#play-illustrate-stop")!,
		save:      document.querySelector<HTMLButtonElement>("#play-illustrate-save")!,
		reset:     document.querySelector<HTMLButtonElement>("#play-illustrate-reset")!,
		close:     document.querySelector<HTMLButtonElement>("#play-illustrate-close")!,
		delete:    document.querySelector<HTMLButtonElement>("#play-illustrate-delete")!
	};
	const status  = document.querySelector<HTMLElement>     ("#play-illustrate-status")!;
	const result  = document.querySelector<HTMLElement>     ("#play-illustrate-result")!;
	const preview = document.querySelector<HTMLImageElement>("#play-illustrate-preview")!;
	const caption = document.querySelector<HTMLElement>     ("#play-illustrate-result-caption")!;

	/** message whose illustration the result block shows */
	let shownMid: number | null = null;
	let rendering: AbortController | null = null;

	buttons.summarize.addEventListener("click", summarize);
	buttons.compose.addEventListener("click", compose);
	buttons.render.addEventListener("click", render);
	buttons.all.addEventListener("click", runAll);
	buttons.stop.addEventListener("click", stop);
	buttons.save.addEventListener("click", saveSettings);
	buttons.reset.addEventListener("click", resetPrompts);
	buttons.close.addEventListener("click", () => modal.close());
	buttons.delete.addEventListener("click", deleteIllustration);
	providerPicker.addEventListener("input", () => {
		const actives = readActiveProviders();
		actives.illustrate = providerPicker.value;
		local.set("activeProvider", JSON.stringify(actives));
	});
	listen(u => {
		if (u.storage !== "local" || u.key !== "activeProvider") return;
		updateProviderPicker();
	});
	updateProviderPicker();
	setBusy(false);

	function updateProviderPicker() {
		const providerOptions = Object.entries(readProviders());
		const activeId = readActiveProviders().illustrate ?? null;
		setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId);
	}
	function pickedProvider(): Provider | null {
		const provider = readProviders()[providerPicker.value];
		if (!provider) toast("pick a provider for illustrations first");
		return provider ?? null;
	}
	function readSettingsInputs(): IllustrateSettings {
		return {
			summaryPrompt: prompts.summary.value.trim() || ILLUSTRATE_DEFAULTS.summaryPrompt,
			tagsPrompt:    prompts.tags.value.trim()    || ILLUSTRATE_DEFAULTS.tagsPrompt
		};
	}
	function setBusy(busy: boolean) {
		for (const b of [buttons.summarize, buttons.compose, buttons.render, buttons.all, buttons.delete])
			b.disabled = busy;
		buttons.stop.hidden = !busy;
		if (!busy) setStatus(null);
	}
	function setStatus(value: string | null) {
		status.hidden = value === null;
		status.textContent = value ?? "";
	}

	function fill(session: ChatSession) {
		const settings = settingsOf(session);
		prompts.summary.value = settings.summaryPrompt;
		prompts.tags.value    = settings.tagsPrompt;
		showResult(session);
		// offer the latest illustration's inputs for tweaking and re-rendering
		const latest = shownMid === null ? null : session.contents.messages[shownMid]?.illustration;
		outputs.summary.value = latest?.summary ?? "";
		outputs.tags.value    = latest?.prompt  ?? "";
	}
	function showResult(session: ChatSession) {
		const illustrated = session.contents.messages.findLast(m => m.illustration);
		shownMid = illustrated?.id ?? null;
		result.hidden = !illustrated;
		if (!illustrated) return;
		const art = illustrated.illustration!;
		caption.textContent = `#${illustrated.id}: ${art.prompt}`;
		preview.removeAttribute("src");
		getBlobLink(art.media).then(src => { if (src) preview.src = src; });
	}

	async function summarize() {
		const session = getSession();
		const provider = pickedProvider();
		if (!session || !provider) return false;

		outputs.summary.value = "";
		setBusy(true);
		const generated = await runJob(
			"illustrate", provider,
			sceneSummaryPrompt(session, readSettingsInputs().summaryPrompt),
			{ onChunk: chunk => outputs.summary.value += chunk }
		);
		setBusy(false);
		if (!generated.success) {
			toast(generated.error);
			return false;
		}
		outputs.summary.value = generated.value.trim();
		return true;
	}

	async function compose() {
		const provider = pickedProvider();
		const summary = outputs.summary.value.trim();
		if (!provider) return false;
		if (!summary) {
			toast("summarize the scene first");
			return false;
		}

		outputs.tags.value = "";
		setBusy(true);
		const generated = await runJob(
			"illustrate", provider,
			sceneTagsPrompt(readSettingsInputs().tagsPrompt, summary),
			{ onChunk: chunk => outputs.tags.value += chunk }
		);
		setBusy(false);
		if (!generated.success) {
			toast(generated.error);
			return false;
		}
		outputs.tags.value = generated.value.trim();
		return true;
	}

	async function render() {
		const tags = outputs.tags.value.trim();
		if (!tags) {
			toast("compose the image prompt first");
			return false;
		}
		const config = loadIllustrateConfig();

		rendering = new AbortController();
		setBusy(true);
		const rendered = await renderImage(config, tags, rendering.signal, setStatus);
		rendering = null;
		if (!rendered.success) {
			setBusy(false);
			toast(rendered.error);
			return false;
		}

		setStatus("saving...");
		await attach(rendered.value, { prompt: tags, summary: outputs.summary.value.trim() });
		setBusy(false);
		return true;
	}

	async function runAll() {
		if (!await summarize()) return;
		if (!await compose()) return;
		await render();
	}
	function stop() {
		cancelJob();
		rendering?.abort();
	}

	/** Stores the image and attaches it to the last message of the current chat */
	async function attach(image: Blob, meta: Omit<Illustration, "media">) {
		const session = getSession();
		const target = session && lastMessage(session);
		if (!session || !target) {
			toast("no message to attach the illustration to");
			return;
		}
		const [file] = await optimizeToWEBP(image);
		const media = await upload(file);
		const previous = setIllustration(session, target.id, { media, ...meta });
		await commitContents(session);
		if (previous) dropMedia(previous.media);
		getMessageView(session.chat.id, target.id)?.controls.refresh();
		showResult(session);
	}

	async function deleteIllustration() {
		const session = getSession();
		if (!session || shownMid === null) return;
		if (!confirm(`the illustration on message #${shownMid} will be deleted`)) return;

		const previous = setIllustration(session, shownMid, null);
		await commitContents(session);
		if (previous) dropMedia(previous.media);
		getMessageView(session.chat.id, shownMid)?.controls.refresh();
		showResult(session);
	}

	async function saveSettings() {
		const session = getSession();
		if (!session) return;
		session.chat.illustrate = readSettingsInputs();
		await commitChat(session);
		const details = prompts.summary.closest("details");
		if (details) details.open = false;
	}
	function resetPrompts() {
		if (!confirm("the current illustrate prompts will be lost after saving the settings")) return;
		prompts.summary.value = ILLUSTRATE_DEFAULTS.summaryPrompt;
		prompts.tags.value    = ILLUSTRATE_DEFAULTS.tagsPrompt;
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

function settingsOf(session: ChatSession): IllustrateSettings {
	return session.chat.illustrate ?? ILLUSTRATE_DEFAULTS;
}

function dropMedia(id: string) {
	revokeBlobLink(id);
	idb.del("media", id);
}
