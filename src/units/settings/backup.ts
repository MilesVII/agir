import { RampikeFilePicker } from "@rampike/filepicker";
import { idb, IDBStore, local, LocalKey } from "@root/persist";
import { MediaEntry } from "@root/types";
import { b64Encoder, download } from "@root/utils";
import { toast } from "@units/toasts";
import { mudcrack } from "rampike";

export function initBackup() {
	const saveButton          = document.querySelector("#settings-backup-save")!;
	const importPicker        = document.querySelector<RampikeFilePicker>("#settings-backup-import")!;
	const cleanupButton       = document.querySelector("#settings-media-clean")!;
	const partialList         = document.querySelector<HTMLElement>("#settings-backup-partial-list")!;
	const savePartialButton   = document.querySelector("#settings-backup-partial")!;

	const { backupCall: runPartial } = initPartial(partialList);

	saveButton.addEventListener("click", () => backup());
	importPicker.addEventListener("input", () => restore(importPicker));
	cleanupButton.addEventListener("click", mediaCleanup);
	savePartialButton.addEventListener("click", () => runPartial());
}

const ALL_STORES: IDBStore[] = [
	"chatContents",
	"chats",
	"personas",
	"scenarios",
	"media"
];
async function backup(
	backupKeys: IDBStore[] = ALL_STORES,
	settings = true
) {
	if (backupKeys.length === 0 && !settings) {
		toast("nothing selected");
		return;
	}
	const closeToast = toast("on it, please wait...");
	const idbBackupEntries = await Promise.all(
		backupKeys.map(
			async k => [k, await idb.getAll(k)] as const
		)
	);

	const idbBackup = Object.fromEntries(
		idbBackupEntries
			.filter(([k, v]) => {
				if (!v.success) {
					toast(`failed to read ${k}; skipped`);
				}
				return v.success;
			})
			.map(([k, v]) => [k, v.success ? v.value : []])
	);

	if ("media" in idbBackup) {
		for (const m of idbBackup.media as MediaEntry[]) {
			// @ts-ignore
			m.media = await b64Encoder.encode(m.media);
		}
	}

	const backup: {
		idb: typeof idbBackup,
		local: Partial<Record<LocalKey, string | null>>
	} = {
		idb: idbBackup,
		local: {}
	};

	if (settings) {
		const localData = {
			providers: local.get("providers"),
			activeProvider: local.get("activeProvider"),
			settings: local.get("settings"),
			theme: local.get("theme"),
		};
		backup.local = localData;
	}

	const payload = JSON.stringify(backup);

	closeToast();
	const isFull = ALL_STORES.length === backupKeys.length && settings;
	download(payload, `${new Date().toLocaleString()}${isFull ? "" : "_PARTIAL"}.aegir.backup.json`);
}

async function restore(picker: RampikeFilePicker) {
	const file = picker.input.files?.[0];
	if (!file) return;

	const closeToast = toast("on it, please wait...");
	const raw = await file.text();
	const parsed = JSON.parse(raw);

	if (parsed.idb.media) {
		const media: MediaEntry[] = [];
		for (const item of parsed.idb.media) {
			media.push({
				id: item.id,
				media: await b64Encoder.decode(item.media),
				mime: item.mime
			});
		}
		const r = await idb.setMany("media", media);
		if (!r.success) toast("failed to restore media");
	}

	for (const [store, data] of Object.entries<any[]>(parsed.idb)) {
		if (store === "media") continue;

		for (const item of data) {
			// HACK: temporary migration upgrade
			if (store === "chats" && !item.messageChunks)
				item.messageChunks = [];
		}
		// @ts-ignore
		const r = await idb.setMany(store, data);
		if (!r.success) toast(`failed to restore ${store}`);
	}

	for (const [key, data] of Object.entries<string>(parsed.local)) {
		if (data) local.set(key as LocalKey, data);
	}
	closeToast();
	toast("restore complete!");
}

async function mediaCleanup() {
	const media = await idb.getAll("media");
	if (!media.success) {
		toast("can't load media");
		return;
	}

	const mids = new Set(media.value.map(m => m.id));
	const checkout = (id: string | null) => {
		if (id) mids.delete(id);
	}

	const [
		chats,
		personas,
		scenarios,
	] = (await Promise.all([
		idb.getAll("chats"),
		idb.getAll("personas"),
		idb.getAll("scenarios")
	]));

	if (!chats.success || !personas.success || !scenarios.success) {
		toast("loaded the media but can't load other data, aborting");
		return;
	}

	for (const chat of chats.value) {
		checkout(chat.scenario.picture);
		checkout(chat.userPersona.picture);
	}
	for (const persona of personas.value) {
		checkout(persona.picture);
	}
	for (const scenario of scenarios.value) {
		checkout(scenario.card.picture);
		checkout(scenario.chat.picture);
	}
	
	if (mids.size > 0) {
		const close = toast(`media found: ${mids.size}, deleting...`);
		await Promise.all(
			mids
				.values()
				.map(id => idb.del("media", id))
		);
		close();
		toast(`done; ${mids.size} items deleted`);
	} else {
		toast("no unused media found");
	}
}

function initPartial(list: HTMLElement) {
	function checkbox(caption: string) {
		const cb = mudcrack({
			tagName: "input",
			attributes: {
				type: "checkbox",
				checked: "true"
			},
		});
		const e = mudcrack({
			tagName: "label",
			className: "row-compact align-center",
			contents: [
				cb,
				mudcrack({
					tagName: "div",
					contents: caption
				}),
			]
		});
		return [e, () => cb.checked] as const;
	}
	list.innerHTML = "";

	const items = {
		chats: checkbox("Chats"),
		media: checkbox("Media"),
		personas: checkbox("Personas"),
		scenarios: checkbox("Scenario library"),
		settings: checkbox("Settings")
	};

	list.append(...Object.values(items).map(([e]) => e));

	return {
		backupCall: () => {
			const stores: IDBStore[] = [];
			if (items.chats[1]()) {
				stores.push("chats");
				stores.push("chatContents");
			}
			if (items.media[1]()) stores.push("media");
			if (items.personas[1]()) stores.push("personas");
			if (items.scenarios[1]()) stores.push("scenarios");

			return backup(stores, items.settings[1]());
		}
	}
}
