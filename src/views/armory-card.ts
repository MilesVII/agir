import html from "./armory-card.html";
import { placeholder } from "@root/utils";
import { htmlTemplate, sirocco, sprout } from "rampike";

export type ArmoryCardData = {
	icon: string | null,
	summary: string,
	downloadCaption: string,
	/** false when the scenario is already in the library and up to date */
	downloadable: boolean
};
export type ArmoryCardState = "ready" | "downloading" | "done";

const template = htmlTemplate(html);
const REFS = {
	icon: HTMLImageElement,
	summary: HTMLElement,
	download: HTMLButtonElement,
	progress: HTMLProgressElement,
	status: HTMLElement
};

/** One scenario offered by an armory. The unit drives the download through `controls`. */
export function makeArmoryCardView(data: ArmoryCardData, onDownload: () => void) {
	const { root, refs: r } = sprout(template, REFS);

	r.icon.src = placeholder(data.icon);
	r.summary.textContent = data.summary;
	r.download.textContent = data.downloadCaption;
	r.download.addEventListener("click", onDownload);

	function setState(state: ArmoryCardState) {
		r.download.hidden = state !== "ready";
		r.progress.hidden = state !== "downloading";
		r.status.hidden   = state !== "done";
	}
	function setProgress(fraction: number) {
		r.progress.value = fraction * 100;
	}

	setState(data.downloadable ? "ready" : "done");

	return sirocco(root, { setState, setProgress }, "controls");
}
export type ArmoryCardView = ReturnType<typeof makeArmoryCardView>;
