import { RampikeModal } from "@rampike/modal";
import { local } from "@root/persist";
import { renderMD } from "@root/utils";

export function docsUnit() {
	const introMessage = document.querySelector<HTMLElement>("#help-message")!;
	const introModal = document.querySelector<RampikeModal>("#help-modal")!;
	const introClose = document.querySelector<HTMLButtonElement>("#help-close")!;

	introClose.addEventListener("click", () => introModal.close());

	const fl = local.get("firstLaunch");
	if (fl) return;

	fetch("assets/docs/intro.md").then(async r => {
		if (!r.ok) return;
		local.set("firstLaunch", `{ "intro": true }`);
		introMessage.innerHTML = renderMD(await r.text());
		introModal.open();
	});
}
