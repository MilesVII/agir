import { RampikeModal } from "@rampike/modal";
import { local } from "@root/persist";
import { renderMD } from "@root/utils";
import { toast } from "./toasts";

const DOCS = {
	intro:    "assets/docs/intro.md",
	tutorial: "assets/docs/tutorial.md"
};

export function docsUnit() {
	const introModal = document.querySelector<RampikeModal>("#help-modal")!;
	const introClose = document.querySelector<HTMLButtonElement>("#help-close")!;

	introClose.addEventListener("click", () => introModal.close());

	const openers: [selector: string, doc: keyof typeof DOCS][] = [
		["#settings-docs-intro",          "intro"],
		["#settings-docs-creator-guide",  "tutorial"],
		["#scenario-tutorial",            "tutorial"]
	];
	for (const [selector, doc] of openers)
		document.querySelector(selector)!.addEventListener("click", async () => {
			if (!await showDoc(doc)) toast("Couldn't load the docs, check your connection");
		});

	if (local.get("firstLaunch")) return;
	showDoc("intro").then(shown => {
		// offline: the intro shows on a later visit
		if (shown) local.set("firstLaunch", `{ "intro": true }`);
	});
}

/** loads a doc into the help modal and opens it; false when the doc couldn't be fetched */
async function showDoc(doc: keyof typeof DOCS) {
	const r = await fetch(DOCS[doc]).catch(() => null);
	if (!r?.ok) return false;

	const message = document.querySelector<HTMLElement>("#help-message")!;
	const modal = document.querySelector<RampikeModal>("#help-modal")!;
	message.innerHTML = renderMD(await r.text());
	message.querySelectorAll("abbr[title]")
		.forEach(e => e.addEventListener("click", () => alert(e.getAttribute("title"))));
	modal.open();
	message.scrollIntoView({ block: "start" });
	return true;
}
