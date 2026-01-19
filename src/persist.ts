import { Engine, Persona, Result } from "./types";
import { revolvers } from "./utils";

type IDBStorageSchema = {
	media: {
		id: string,
		media: Blob,
		mime: string
	},
	personas: Persona
};
export type IDBStore = keyof IDBStorageSchema;
export type LocalKey = "theme" | "engines" | "rember";

type StorageUpdate = {
	storage: "idb",
	store: IDBStore;
} | {
	storage: "local",
	key: LocalKey
};
type StorageListener = (event: StorageUpdate) => void;

const storageListeners: StorageListener[] = [];
const bc = new BroadcastChannel("storage-updates");
bc.onmessage = ({ data }) => {
	storageListeners.forEach(l => l(data));
};
const { promise: dbInitPromise, resolve: dbInitComplete } = revolvers<IDBDatabase>();

export function listen(listener: StorageListener) {
	storageListeners.push(listener);
}

export async function init() {
	const result = await open();
	if (result.success) dbInitComplete(result.value);
	else console.error(result.error);
	return result.success;
}

export const idb = { get, set, getAll, del };
export const local = { get: localGet, set: localSet };

async function get<T extends IDBStore>(store: T, key: IDBStorageSchema[T]["id"]): Promise<Result<IDBStorageSchema[T], any>> {
	const db = await dbInitPromise;

	const r = db
		.transaction(store, "readonly")
		.objectStore(store)
		.get(key);

	return await new Promise(resolve => {
		r.onsuccess = () => resolve({ success: true, value: r.result });
		r.onerror = () => resolve({ success: false, error: "read error" });
	});
}

async function getAll<T extends IDBStore>(store: T): Promise<Result<IDBStorageSchema[T][], any>> {
	const db = await dbInitPromise;

	const r = db
		.transaction(store, "readonly")
		.objectStore(store)
		.getAll();

	return await new Promise(resolve => {
		r.onsuccess = () => resolve({ success: true, value: r.result });
		r.onerror = () => resolve({ success: false, error: "read error" });
	});
}

async function set<T extends IDBStore>(store: T, value: IDBStorageSchema[T]) {
	const db = await dbInitPromise;

	const r = db
		.transaction(store, "readwrite")
		.objectStore(store)
		.put(value);

	return await new Promise(resolve => {
		r.onsuccess = () => {
			resolve({ success: true, value: r.result });
			const update: StorageUpdate = { storage: "idb", store: store };
			bc.postMessage(update);
			storageListeners.forEach(l => l(update));
		};
		r.onerror = () => resolve({ success: false, error: "write error" });
	});
}

async function del<T extends IDBStore>(store: T, id: string) {
	const db = await dbInitPromise;

	const r = db
		.transaction(store, "readwrite")
		.objectStore(store)
		.delete(id);

	return await new Promise(resolve => {
		r.onsuccess = () => {
			resolve({ success: true, value: r.result });
			const update: StorageUpdate = { storage: "idb", store: store };
			bc.postMessage(update);
			storageListeners.forEach(l => l(update));
		};
		r.onerror = () => resolve({ success: false, error: "write error" });
	});
}

function open() {
	return new Promise<Result<IDBDatabase, any>>(resolve => {
		const r = window.indexedDB.open("ehh", 1);
		r.onsuccess = () => resolve({ success: true,  value: r.result });
		r.onerror =   () => resolve({ success: false, error: r.error });
		r.onupgradeneeded = () => {
			const db = r.result;

			db.createObjectStore("media",     { keyPath: "id" });
			db.createObjectStore("personas",  { keyPath: "id" });
			db.createObjectStore("chats",     { keyPath: "id" });
			db.createObjectStore("scenarios", { keyPath: "id" });
		}
	});
}

function localGet(key: LocalKey) {
	return window.localStorage.getItem(key)
}
function localSet(key: LocalKey, value: string) {
	window.localStorage.setItem(key, value);
	const update: StorageUpdate = { storage: "local", key };
	bc.postMessage(update);
	storageListeners.forEach(l => l(update));
}

const map = new Map<string, string>();
export async function getBlobLink(imageRef: string) {
	if (map.has(imageRef)) {
		return map.get(imageRef)!;
	}
	const blob = await get("media", imageRef);
	if (!blob.success) return null;

	const link = URL.createObjectURL(blob.value.media);
	map.set(imageRef, link);
	return link;
}
export function revokeBlobLink(imageRef: string) {
	const link = map.get(imageRef);
	map.delete(imageRef);
	if (link) URL.revokeObjectURL(link);
}
