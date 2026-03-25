import { RampikeFilePicker } from "@rampike/filepicker";
import { idb, local, LocalKey } from "@root/persist";
import { b64Encoder, download } from "@root/utils";
import { toast } from "@units/toasts";

export function initBackup() {
	const saveButton    = document.querySelector("#settings-backup-save")!;
	const importPicker  = document.querySelector<RampikeFilePicker>("#settings-backup-import")!;
	const cleanupButton = document.querySelector("#settings-media-clean")!;

	saveButton.addEventListener("click", backup);
	importPicker.addEventListener("input", () => restore(importPicker));
	cleanupButton.addEventListener("click", mediaCleanup);
}

async function backup() {
	const closeToast = toast("on it, please wait...");
	const [
		chatContents,
		chats,
		personas,
		scenarios,
		media
	] = (await Promise.all([
		idb.getAll("chatContents"),
		idb.getAll("chats"),
		idb.getAll("personas"),
		idb.getAll("scenarios"),
		idb.getAll("media")
	]));
	const localData = {
		providers: local.get("providers"),
		activeProvider: local.get("activeProvider"),
		settings: local.get("settings"),
		theme: local.get("theme"),
	};

	const validOnly = (() => {
		const results = Object.entries({ chatContents, chats, personas, scenarios });
		return Object.fromEntries(
			results
				.filter(([k, v]) => v.success)
				// @ts-ignore
				.map(([k, v]) => [k, v.value])
		);
	})();

	if (media.success) {
		validOnly.media = media.value;
		for (const m of validOnly.media) {
			m.media = await b64Encoder.encode(m.media);
		}
	}

	const payload = JSON.stringify({
		idb: validOnly,
		local: localData
	});

	closeToast();
	download(payload, `${new Date().toLocaleString()}.aegir.backup.json`);
}

async function restore(picker: RampikeFilePicker) {
	const file = picker.input.files?.[0];
	if (!file) return;

	const closeToast = toast("on it, please wait...");
	const raw = await file.text();
	const parsed = JSON.parse(raw);

	if (parsed.idb.media) {
		for (const item of parsed.idb.media) {
			await idb.set(
				"media",
				{
					id: item.id,
					media: await b64Encoder.decode(item.media),
					mime: item.mime
				}
			);
		}
	}

	for (const [store, data] of Object.entries<any>(parsed.idb)) {
		if (store === "media") continue;

		for (const item of data) {
			// HACK: temporary migration upgrade
			if (store === "chats" && !item.messageChunks)
				item.messageChunks = [];
			// @ts-ignore
			await idb.set(store, item);
		}
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
