import { RampikeFilePicker } from "@rampike/filepicker";
import { idb, local, LocalKey } from "@root/persist";
import { b64Encoder } from "@root/utils";
import { mudcrack } from "rampike";

export function initBackup() {
	const saveButton = document.querySelector("#settings-backup-save")!;
	saveButton.addEventListener("click", backup);
	const importPicker = document.querySelector<RampikeFilePicker>("#settings-backup-import")!;
	importPicker.addEventListener("input", () => restore(importPicker));
}

async function backup() {
	const [chatContents, chats, personas, scenarios, media] = (await Promise.all([
		idb.getAll("chatContents"),
		idb.getAll("chats"),
		idb.getAll("personas"),
		idb.getAll("scenarios"),
		idb.getAll("media")
	]));
	const localData = {
		engines: local.get("engines"),
		activeEngine: local.get("activeEngine"),
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

	const blob = new Blob([payload], { type: "text/plain" });
	const url = URL.createObjectURL(blob);

	mudcrack({
		tagName: "a",
		attributes: {
			href: url,
			download: `backup-${new Date().toLocaleString()}.json`
		}
	}).click();

	URL.revokeObjectURL(url);
}

async function restore(picker: RampikeFilePicker) {
	const file = picker.input.files?.[0];
	if (!file) return;

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
			// @ts-ignore
			await idb.set(store, item);
		}
	}

	for (const [key, data] of Object.entries<string>(parsed.local)) {
		if (data) local.set(key as LocalKey, data);
	}
}
