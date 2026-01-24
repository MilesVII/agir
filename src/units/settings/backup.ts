import { RampikeFilePicker } from "@rampike/filepicker";
import { idb, local } from "@root/persist";
import { mudcrack } from "rampike";

export function initBackup() {
	const saveButton = document.querySelector("#settings-backup-save")!;
	saveButton.addEventListener("click", backup);
	const importPicker = document.querySelector<RampikeFilePicker>("#settings-backup-import")!;
	importPicker.addEventListener("input", () => restore(importPicker));
}

async function backup() {
	const [chatContents, chats, personas, scenarios] = (await Promise.all([
		idb.getAll("chatContents"),
		idb.getAll("chats"),
		idb.getAll("personas"),
		idb.getAll("scenarios")
	])).filter(v => v.success).map(v => v.value);
	const localData = {
		engines: local.get("engines"),
		rember: local.get("rember"),
		theme: local.get("theme"),
	};

	const payload = JSON.stringify({ idb: { chatContents, chats, personas, scenarios }, local: localData });

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

	console.log(parsed.idb)
	for (const [store, data] of Object.entries(parsed.idb)) {
		for (const item of data as any) {
			// @ts-ignore
			await idb.set(store, item);
		}
	}
}
