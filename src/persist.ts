import { toast } from "@units/toasts";
import { Chat, ChatContents, MediaEntry, Persona, Result, ScenarioCard } from "./types";
import { nothrowAsync, revolvers } from "./utils";

type IDBStorageSchema = {
	media: MediaEntry,
	personas: Persona,
	chats: Chat,
	chatContents: ChatContents,
	scenarios: ScenarioCard
};
const IDB_INDESEX = {
	personas:  "lastUpdate",
	chats:     "lastUpdate",
	scenarios: "lastUpdate"
} satisfies {
	[T in keyof IDBStorageSchema]?: keyof IDBStorageSchema[T]
};
const INDEX_SORTED = "sorted";
export type IDBStore = keyof IDBStorageSchema;
export type LocalKey = "theme" | "providers" | "settings" | "activeProvider" | "armories" | "firstLaunch" | "cheats";

type StorageUpdate = ({
	storage: "idb",
	store: IDBStore;
} | {
	storage: "local",
	key: LocalKey
}) & {
	remote?: boolean
};
type StorageListener = (event: StorageUpdate) => void;

const storageListeners: StorageListener[] = [];
const bc = new BroadcastChannel("storage-updates");
bc.onmessage = ({ data }) => {
	const update: StorageUpdate = { ...data, remote: true };
	storageListeners.forEach(l => l(update));
};
const { promise: dbInitPromise, resolve: dbInitComplete } = revolvers<IDBDatabase>();

export function listen(listener: StorageListener) {
	storageListeners.push(listener);
}

export async function init() {
	const result = await open();
	if (result.success) dbInitComplete(result.value);
	else toast(result.error);
	return result.success;
}

export const idb = { get, set, setMany, getAll, del };
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

	const r = (store in IDB_INDESEX)
		? db
			.transaction(store, "readonly")
			.objectStore(store)
			.index("sorted")
			.getAll()
		: db
			.transaction(store, "readonly")
			.objectStore(store)
			.getAll();

	return await new Promise(resolve => {
		r.onsuccess = () => resolve({ success: true, value: r.result });
		r.onerror = () => resolve({ success: false, error: "read error" });
	});
}

async function set<T extends IDBStore>(store: T, value: IDBStorageSchema[T]): Promise<Result<IDBValidKey, string>> {
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

/**
 * Writes all values in one transaction and notifies listeners once at the end:
 * restoring a backup item by item would re-render every list once per item
 */
async function setMany<T extends IDBStore>(store: T, values: IDBStorageSchema[T][]): Promise<Result<number, string>> {
	if (values.length === 0) return { success: true, value: 0 };
	const db = await dbInitPromise;

	const tx = db.transaction(store, "readwrite");
	const objectStore = tx.objectStore(store);
	for (const value of values) objectStore.put(value);

	return await new Promise(resolve => {
		tx.oncomplete = () => {
			resolve({ success: true, value: values.length });
			const update: StorageUpdate = { storage: "idb", store: store };
			bc.postMessage(update);
			storageListeners.forEach(l => l(update));
		};
		tx.onerror = () => resolve({ success: false, error: "write error" });
		tx.onabort = () => resolve({ success: false, error: "write error" });
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

			                  db.createObjectStore("media",        { keyPath: "id" });
			const personas =  db.createObjectStore("personas",     { keyPath: "id" });
			const chats =     db.createObjectStore("chats",        { keyPath: "id" });
			                  db.createObjectStore("chatContents", { keyPath: "id" });
			const scenarios = db.createObjectStore("scenarios",    { keyPath: "id" });

			 personas.createIndex(INDEX_SORTED, IDB_INDESEX.personas);
			    chats.createIndex(INDEX_SORTED, IDB_INDESEX.chats);
			scenarios.createIndex(INDEX_SORTED, IDB_INDESEX.scenarios);
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

export async function upload(blob: Blob): Promise<string | null> {
	const bytes = await nothrowAsync(blob.arrayBuffer());
	if (!bytes.success) {
		toast("can't read the picture, it was not saved");
		return null;
	}
	const id = crypto.randomUUID();
	const media = new Blob([bytes.value], { type: blob.type });
	const stored = await set("media", { id, media, mime: media.type });
	if (!stored.success) {
		toast("can't save the picture");
		return null;
	}
	return id;
}
/** A picture ref that points at the web instead of a stored media entry */
export function isRemoteRef(imageRef: string) {
	return /^https?:\/\//i.test(imageRef);
}
/**
 * The picture's bytes: a stored media entry if there is one (backups embed remote pictures
 * under their URL), otherwise a remote ref is fetched
 */
export async function getMedia(imageRef: string): Promise<MediaEntry | null> {
	const stored = await get("media", imageRef);
	if (stored.success && stored.value) return stored.value;
	if (!isRemoteRef(imageRef)) return null;

	const response = await nothrowAsync(fetch(imageRef));
	if (!response.success || !response.value.ok) return null;
	const media = await nothrowAsync(response.value.blob());
	if (!media.success) return null;
	return { id: imageRef, media: media.value, mime: media.value.type };
}
const map = new Map<string, string>();
export async function getBlobLink(imageRef: string) {
	if (map.has(imageRef)) {
		return map.get(imageRef)!;
	}
	const blob = await get("media", imageRef);
	if (!blob.success || !blob.value) return isRemoteRef(imageRef) ? imageRef : null;

	const link = URL.createObjectURL(blob.value.media);
	map.set(imageRef, link);
	return link;
}
export function revokeBlobLink(imageRef: string) {
	const link = map.get(imageRef);
	map.delete(imageRef);
	if (link) URL.revokeObjectURL(link);
}
