import { toast } from "./toasts";

/*
Registers sw.js (offline use and fresh updates, see src/sw.js) and offers a reload when a newer build takes over.
Open tabs look for an update when they come back to the foreground, at most every CHECK_EVERY_MS.
*/

/** this bundle's build version, set by scripts/build.mjs */
declare const AEGIR_BUILD: string;

const CHECK_EVERY_MS = 10 * 60 * 1000;

export function serviceWorkerUnit() {
	if (!("serviceWorker" in navigator)) return;
	let offered = false;

	navigator.serviceWorker.addEventListener("message", e => {
		if (e.data?.kind !== "aegir-activated") return;
		if (e.data.version === AEGIR_BUILD || offered) return;
		offered = true;
		toast("Ägir has been updated, reload the page to get the new version", {
			actions: [
				["later", close => close()],
				["reload", () => location.reload()]
			]
		});
	});

	navigator.serviceWorker.register("sw.js").then(registration => {
		let checkedAt = Date.now();
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState !== "visible") return;
			if (Date.now() - checkedAt < CHECK_EVERY_MS) return;
			checkedAt = Date.now();
			registration.update().catch(() => {});
		});
	}).catch(e => console.warn("service worker registration failed", e));
}
