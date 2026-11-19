import { local } from "@root/persist";
import { nothrow } from "@root/utils";
import type { RampikeTabs } from "@rampike/tabs";
import { MAX_BLOCKED_TAGS } from "./datacat-api";
import { type PickedTag, type TagPicker, makeTagPicker } from "./datacat-tags";

/*
The Datacat browser's blacklist tab: searches leave out characters with the tags picked here.
Only the picked tags are stored, so they keep working whatever the tag list shows.
*/

const el = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

export function blockedTags(): PickedTag[] {
	const raw = local.get("datacatBlocked");
	if (!raw) return [];
	const parsed = nothrow(() => JSON.parse(raw) as unknown);
	return parsed.success && Array.isArray(parsed.value) ? parsed.value : [];
}

let picker: TagPicker | null = null;
let changed = false;

export function datacatBlacklistUnit(done: (changed: boolean) => void) {
	const p = picker = makeTagPicker({
		found: el("#datacat-tags"),
		status: el("#datacat-tags-status"),
		picked: el("#datacat-blocked"),
		nonePicked: "Nothing is blocked",
		dropHint: "unblock",
		max: MAX_BLOCKED_TAGS,
		tooMany: `Datacat leaves out at most ${MAX_BLOCKED_TAGS} tags per search: unblock some first`,
		read: blockedTags,
		write: tags => {
			local.set("datacatBlocked", JSON.stringify(tags));
			changed = true;
			updateCount();
		}
	});

	const filter = el<HTMLInputElement>("#datacat-tags-filter");
	filter.addEventListener("keydown", e => {
		if (e.key === "Enter") p.search(filter.value);
	});
	el("#datacat-tags-search").addEventListener("click", () => p.search(filter.value));
	el("#datacat-blacklist-back").addEventListener("click", () => {
		const wasChanged = changed;
		changed = false;
		done(wasChanged);
	});
}

function updateCount() {
	el("#datacat-blocked-count").textContent = `${blockedTags().length}/${MAX_BLOCKED_TAGS}`;
}

/** switches the modal to the blacklist tab; the first visit lists the most used tags */
export function openBlacklist() {
	if (!picker) return;
	el<RampikeTabs>("#datacat-tabs").tab = "blacklist";
	updateCount();
	picker.render();
	if (!picker.searched) picker.search("");
}
