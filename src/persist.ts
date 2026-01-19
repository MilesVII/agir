import { Result } from "./types";

let db: IDBDatabase | null = null;

export async function init() {
	const result = await open();
	if (result.success) db = result.value;
	else console.error(result.error);
	return result.success;
}

export const idb = { get, set };
export const local = { get: localGet, set: localSet };

async function get<T extends keyof IDBStorageSchema>(store: T, key: IDBStorageSchema[T]["id"]): Promise<Result<IDBStorageSchema[T], any>> {
	if (!db) {
		console.error("db not initialized");
		return { success: false, error: "db not initialized" };
	};

	const r = db
		.transaction(store, "readonly")
		.objectStore(store)
		.get(key);

	return await new Promise(resolve => {
		r.onsuccess = () => resolve({ success: true, value: r.result });
		r.onerror = () => resolve({ success: false, error: "read error" });
	});
}

async function set<T extends keyof IDBStorageSchema>(store: T, value: IDBStorageSchema[T]) {
	if (!db) {
		console.error("db not initialized");
		return
	};

	const r = db
		.transaction(store, "readwrite")
		.objectStore(store)
		.put(value);

	return await new Promise(resolve => {
		r.onsuccess = () => resolve({ success: true, value: r.result });
		r.onerror = () => resolve({ success: false, error: "write error" });
	});
}

function open() {
	return new Promise<Result<IDBDatabase, any>>(resolve => {
		const r = window.indexedDB.open("ehh", 1);
		r.onsuccess = () => resolve({ success: true, value: r.result });
		r.onerror = () => resolve({ success: false, error: r.error });
		r.onupgradeneeded = e => {
			const db = r.result;

			db.createObjectStore("media", { keyPath: "id" });
			// mediaStore.createIndex("media", "media", { unique: true });
		}
	});
}

type IDBStorageSchema = {
	media: {
		id: string,
		media: Blob,
		mime: string
	}
};

function localGet(key: "theme") {
	return window.localStorage.getItem(key)
}
function localSet(key: "theme", value: string) {
	return window.localStorage.setItem(key, value);
}
