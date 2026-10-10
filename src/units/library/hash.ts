import { nothrow } from "@root/utils";
import { toast } from "@units/toasts";
import { importDatacatJSON } from "./datacat";
import { idb } from "@root/persist";

const HASH_IMPORT_ROUTE = "#hash-import.";

export function hashListenerUnit() {
	window.addEventListener("hashchange", () => {
		if (!window.location.hash.startsWith(HASH_IMPORT_ROUTE)) return;
		importFromHash();
	})
}

async function importFromHash() {
	const data = window.location.hash.slice(HASH_IMPORT_ROUTE.length);
	const raw = decodeURIComponent(data);
	const parsed = nothrow(() => JSON.parse(raw));
	if (!parsed.success) {
		toast("failed to parse hash import, the card is likely too long. if that's the case, please import JSON file");
		console.error(raw);
		window.location.hash = "chats";
		return;
	}
	
	const converted = await importDatacatJSON(parsed.value);
	idb.set("scenarios", converted);
	toast(`scenario card ${converted.card.title} imported successfully`);
	window.location.hash = "library";
}
