import { nothrowAsync } from "./utils";

/*
cached state
priority:
update > writes > reads:
nothing is written while updates are pending
and nothing is read while writes are settled

design purpos is idb caching that works with
BroadcastChannel sync
*/

export function state<T>(get: () => Promise<T>, set: (v: T) => Promise<void>) {
	type YouGotMail = (v: T) => void;
	type Setter = (old: T) => Promise<T>;
	type WriteQueueEntry = () => void;
	type Handler = symbol | string;

	let value: T;
	let updating: null | symbol = null;
	let writing = false;
	const readQueue: YouGotMail[] = [];
	const writeQueue: WriteQueueEntry[] = [];
	const listeners: Map<Handler, YouGotMail> = new Map();

	async function update() {
		console.log("update call")
		const flag = Symbol();
		updating = flag;
		const v = await nothrowAsync(get());
		// only latest-initiated update is valid
		if (updating !== flag) return;
		updating = null;
		onValid(v.success ? v.value : value);
	}
	update();

	function onValid(nv: T) {
		value = nv;
		if (writeQueue.length === 0) {
			readQueue
				.splice(0, readQueue.length)
				.forEach(cb => cb(nv));
			notify();
		}
		tryWrite();
	}

	async function read(noClone = false) {
		function pull(v: T) {
			return noClone ? v : structuredClone(v);
		}
		if (updating === null && !writing) return pull(value);
		return await new Promise<T>(resolve => readQueue.push((v) => resolve(pull(v))));
	}

	async function write(setter: Setter) {
		const promise = new Promise<void>(resolve => {
			writeQueue.push(async () => {
				writing = true;
				const nv = await nothrowAsync(setter(value));
				if (nv.success) {
					await nothrowAsync(set(nv.value));
				}
				writing = false;
				if (updating === null) onValid(nv.success ? nv.value : value);
				resolve();
			});
		});

		tryWrite();

		return await promise;
	}

	function tryWrite() {
		if (updating !== null || writing || writeQueue.length === 0) return;
		const [wCall] = writeQueue.splice(0, 1);
		wCall();
	}

	function notify() {
		listeners.forEach(cb => cb(value));
	}

	return {
		read, write, update,
		attach: (cb: YouGotMail, tag ?: string) => {
			const handler = tag ?? Symbol();
			listeners.set(handler, cb);
			return handler
		},
		detach: (handler: Handler) => {
			listeners.delete(handler);
		}
	}
}
