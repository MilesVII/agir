import template from "./armory-card.html";
import { placeholder } from "@root/utils";
import { sirocco } from "rampike";
import { instantiate, pickRefs } from "./common";

export type ArmoryCardData = {
	icon: string | null,
	summary: string,
	downloadCaption: string,
	/** false when the scenario is already in the library and up to date */
	downloadable: boolean
};
export type ArmoryCardState = "ready" | "downloading" | "done";

/** One scenario offered by an armory. The unit drives the download through `controls`. */
export function makeArmoryCardView(data: ArmoryCardData, onDownload: () => void) {
	const root = instantiate(template);
	const r = pickRefs(root, ["icon", "summary", "download", "progress", "status"]);
	const progress = r.progress as HTMLProgressElement;

	(r.icon as HTMLImageElement).src = placeholder(data.icon);
	r.summary.textContent = data.summary;
	r.download.textContent = data.downloadCaption;
	r.download.addEventListener("click", onDownload);

	function setState(state: ArmoryCardState) {
		r.download.hidden = state !== "ready";
		progress.hidden   = state !== "downloading";
		r.status.hidden   = state !== "done";
	}
	function setProgress(fraction: number) {
		progress.value = fraction * 100;
	}

	setState(data.downloadable ? "ready" : "done");

	return sirocco(root, { setState, setProgress }, "controls");
}
export type ArmoryCardView = ReturnType<typeof makeArmoryCardView>;
