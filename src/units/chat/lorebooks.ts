import { RampikeFilePicker } from "@rampike/filepicker";
import { RampikeModal } from "@rampike/modal";
import { idb } from "@root/persist";
import { Lorebook } from "@root/types";
import { parseLorebookFile } from "@units/library/lorebook";
import { toast } from "@units/toasts";
import { makeLorebookItemView } from "@views/lorebook-item";
import { placeholderView } from "@views/common";
import { LORE_DEFAULTS, LoreActivation, loreSettingsOf, onLore } from "./lore";
import { ChatSession, commitChat, getSession, onSessionReplaced } from "./session";

/*
🕮 Lorebooks of the open chat: attach (import a file or copy from the scenario card),
enable, remove, tune scan depth and token budget, and see what fired on the last prompt.
*/

export function initLorebooks() {
	const modal      = document.querySelector<RampikeModal>     ("#play-lore")!;
	const counter    = document.querySelector<HTMLButtonElement>("#chat-lore-counter")!;
	const list       = document.querySelector<HTMLElement>      ("#play-lore-list")!;
	const status     = document.querySelector<HTMLElement>      ("#play-lore-status")!;
	const importer   = document.querySelector<RampikeFilePicker>("#play-lore-import")!;
	const scanDepth  = document.querySelector<HTMLInputElement> ("#play-lore-scan-depth")!;
	const budget     = document.querySelector<HTMLInputElement> ("#play-lore-budget")!;
	const buttons = {
		copy:  document.querySelector<HTMLButtonElement>("#play-lore-copy")!,
		save:  document.querySelector<HTMLButtonElement>("#play-lore-save")!,
		close: document.querySelector<HTMLButtonElement>("#play-lore-close")!
	};
	/** what fired for the open chat on the last prompt */
	let last: LoreActivation | null = null;

	counter.addEventListener("click", open);
	buttons.close.addEventListener("click", () => modal.close());
	buttons.copy.addEventListener("click", copyFromCard);
	buttons.save.addEventListener("click", saveSettings);
	importer.addEventListener("input", async () => {
		const file = importer.input.files?.[0];
		importer.input.value = "";
		if (!file) return;
		const parsed = await parseLorebookFile(file);
		if (!parsed.success) {
			toast(parsed.error);
			return;
		}
		await attach([parsed.value]);
	});

	onSessionReplaced(session => {
		last = null;
		updateCounter(session);
	});
	onLore(activation => {
		last = activation;
		updateCounter(getSession());
		if (modal.dialog.open) showStatus();
	});

	function updateCounter(session: ChatSession | null) {
		const books = session?.chat.lorebooks ?? [];
		counter.hidden = books.length === 0;
		counter.textContent = last ? `🕮${last.activated.length}` : "🕮";
		counter.dataset.run = last && last.activated.length > 0 ? "true" : "false";
	}

	function fill(session: ChatSession) {
		const settings = loreSettingsOf(session);
		scanDepth.value = String(settings.scanDepth);
		budget.value    = String(settings.tokenBudget);

		list.innerHTML = "";
		const books = session.chat.lorebooks ?? [];
		if (books.length === 0) list.append(placeholderView("No lorebooks attached"));
		list.append(...books.map(book => makeLorebookItemView(book, {
			toggle: async enabled => {
				book.enabled = enabled;
				await commitChat(session);
				updateCounter(session);
			},
			remove: async () => {
				if (!confirm(`"${book.name}" will be detached from this chat`)) return;
				session.chat.lorebooks = books.filter(b => b !== book);
				await commitChat(session);
				fill(session);
				updateCounter(session);
			}
		})));
		showStatus();
	}

	function showStatus() {
		if (!last) {
			status.textContent = "nothing was sent yet";
			return;
		}
		const names = last.activated.map(a => a.entry.name).join(", ");
		const dropped = last.dropped ? `, ${last.dropped} dropped over budget` : "";
		status.textContent = last.activated.length
			? `last prompt: ${last.activated.length} entries, ~${last.tokens} tokens${dropped}: ${names}`
			: `last prompt: no entries fired${dropped}`;
	}

	/** Adds books the chat doesn't have yet, by id */
	async function attach(books: Lorebook[]) {
		const session = getSession();
		if (!session) return;
		const present = new Set((session.chat.lorebooks ?? []).map(b => b.id));
		const fresh = books.filter(b => !present.has(b.id));
		if (fresh.length === 0) {
			toast("already attached");
			return;
		}
		session.chat.lorebooks = [...(session.chat.lorebooks ?? []), ...fresh];
		await commitChat(session);
		fill(session);
		updateCounter(session);
	}

	async function copyFromCard() {
		const session = getSession();
		if (!session) return;
		const card = await idb.get("scenarios", session.chat.scenario.id);
		const books = card.success ? (card.value?.lorebooks ?? []) : [];
		if (books.length === 0) {
			toast("the scenario card has no lorebooks");
			return;
		}
		await attach(books);
	}

	async function saveSettings() {
		const session = getSession();
		if (!session) return;
		const depth = parseInt(scanDepth.value, 10);
		const tokens = parseInt(budget.value, 10);
		session.chat.lore = {
			scanDepth:   isNaN(depth)  ? LORE_DEFAULTS.scanDepth   : Math.max(1, depth),
			tokenBudget: isNaN(tokens) ? LORE_DEFAULTS.tokenBudget : Math.max(0, tokens)
		};
		await commitChat(session);
		const details = scanDepth.closest("details");
		if (details) details.open = false;
	}

	function open() {
		const session = getSession();
		if (!session) return;
		fill(session);
		modal.open();
	}

	return { open };
}
