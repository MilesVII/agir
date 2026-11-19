import { idb, local } from "@root/persist";
import { revolvers, setSelectOptions } from "@root/utils";
import { MODAL_CLOSE, RampikeModal } from "@rampike/modal";
import type { RampikeTabs } from "@rampike/tabs";
import { placeholderView } from "@views/common";
import { makeDatacatItemView } from "@views/datacat-item";
import { toast } from "@units/toasts";
import { importDatacatJSON } from "./datacat";
import { blockedTags, datacatBlacklistUnit, openBlacklist } from "./datacat-blacklist";
import { type PickedTag, makeTagPicker } from "./datacat-tags";
import {
	type Challenge, type DatacatCharacter, type DatacatRef, type DatacatResult, type DatacatSort, type Lease, type SearchOptions,
	MAX_REQUIRED_TAGS, SORTS, characterPage, dropLease, fetchAvatar, fetchCard, getCharacter,
	markLeaseUsed, parseCharacterLink, pollVerification, searchCharacters, startVerification, usableLease
} from "./datacat-api";

/*
The library's Datacat browser: a modal with two tabs.
"main" finds characters, by a Janitor/Datacat link, by text or by tags, and imports them into the library.
Datacat's text search doesn't look at tags, so the "tags" button finds tags by name instead, and picked tags replace the text.
"blacklist" (datacat-blacklist.ts) picks the tags searches leave out.
"verify" walks through Datacat's human check when an import needs a lease: the check runs on Datacat's page in a new tab,
this tab polls until it passes, then the import that asked for it carries on.
*/

const el = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

export function datacatBrowserUnit() {
	const open = el<HTMLButtonElement>("#library-dc-browser-open");
	const modal = el<RampikeModal>("#datacat-modal");
	const link = el<HTMLInputElement>("#datacat-link");
	const search = el<HTMLInputElement>("#datacat-search");
	let searched = false;

	open.addEventListener("click", () => {
		modal.open();
		if (!searched) {
			searched = true;
			runSearch("");
		}
	});
	el("#datacat-close").addEventListener("click", () => modal.close());
	// closing the modal mid-check cancels the imports waiting on it
	modal.addEventListener(MODAL_CLOSE, () => finishVerification(null));

	el("#datacat-link-go").addEventListener("click", () => openLink(link.value));
	link.addEventListener("keydown", e => {
		if (e.key === "Enter") openLink(link.value);
	});
	const finder = makeTagPicker({
		found: el("#datacat-found"),
		status: el("#datacat-found-status"),
		picked: el("#datacat-picked"),
		dropHint: "drop",
		max: MAX_REQUIRED_TAGS,
		tooMany: `Datacat takes at most ${MAX_REQUIRED_TAGS} tags per search`,
		read: () => [...requiredTags],
		write: tags => {
			requiredTags = tags;
			runSearch(lastQuery ?? "");
		}
	});
	// a text search means the text: picked tags would make Datacat ignore it
	const searchText = () => {
		if (requiredTags.length > 0) {
			requiredTags = [];
			finder.render();
		}
		runSearch(search.value);
	};
	el("#datacat-search-go").addEventListener("click", searchText);
	search.addEventListener("keydown", e => {
		if (e.key === "Enter") searchText();
	});
	el("#datacat-search-tags").addEventListener("click", () => {
		el("#datacat-found-panel").hidden = false;
		finder.search(search.value);
	});
	el("#datacat-found-hide").addEventListener("click", () => el("#datacat-found-panel").hidden = true);
	el("#datacat-more").addEventListener("click", () => {
		if (nextPage) runSearch(nextPage.query, nextPage.offset, nextPage.options);
	});

	const sort = el<HTMLSelectElement>("#datacat-sort");
	setSelectOptions(sort, Object.entries(SORTS), currentSort());
	sort.addEventListener("change", () => {
		local.set("datacatSort", sort.value);
		if (lastQuery !== null) runSearch(lastQuery);
	});

	updateBlacklistCaption();
	el("#datacat-blacklist-open").addEventListener("click", openBlacklist);
	datacatBlacklistUnit(changed => {
		el<RampikeTabs>("#datacat-tabs").tab = "main";
		updateBlacklistCaption();
		if (changed && lastQuery !== null) runSearch(lastQuery);
	});

	el("#datacat-verify-cancel").addEventListener("click", () => finishVerification(null));
	el("#datacat-verify-retry").addEventListener("click", beginChallenge);
	// coming back from Datacat's tab: check right away instead of waiting for the next poll
	window.addEventListener("focus", () => {
		if (challenge) poll(challenge);
	});
}

// ---- main tab ----

let listSequence = 0;
let nextPage: { query: string, offset: number, options: SearchOptions } | null = null;
/** what the result list shows: a search's query, or null for a looked-up link */
let lastQuery: string | null = null;
/** tags results must have; while there are any, the query is left out */
let requiredTags: PickedTag[] = [];

function currentSort(): DatacatSort {
	const stored = local.get("datacatSort");
	return stored && Object.hasOwn(SORTS, stored) ? stored as DatacatSort : "score";
}
function searchOptions(): SearchOptions {
	return { sort: currentSort(), tagIds: requiredTags.map(t => t.id), blockedTagIds: blockedTags().map(t => t.id) };
}
function updateBlacklistCaption() {
	const count = blockedTags().length;
	el("#datacat-blacklist-open").textContent = count > 0 ? `blacklist (${count})` : "blacklist";
}

function setStatus(contents: (string | Node)[] | null) {
	const status = el("#datacat-status");
	status.hidden = !contents;
	status.replaceChildren(...(contents ?? []));
}

function showCharacters(characters: DatacatCharacter[], append: boolean) {
	const list = el("#datacat-results");
	const views = characters.map(c => makeDatacatItemView(c, button => importCharacter(c, button)));
	if (append) list.append(...views);
	else list.replaceChildren(...views);
}

/** a new search reads the sort, picked tags and blacklist; "more" carries the first page's along */
async function runSearch(query: string, offset = 0, options = searchOptions()) {
	const run = ++listSequence;
	lastQuery = query;
	const more = el<HTMLButtonElement>("#datacat-more");
	more.disabled = true;
	if (offset === 0) {
		nextPage = null;
		more.hidden = true;
		setStatus(null);
		el("#datacat-results").replaceChildren(placeholderView("Searching…"));
	}

	const r = await searchCharacters(query, options, offset);
	if (run !== listSequence) return;
	more.disabled = false;
	if (!r.success) {
		if (offset === 0) el("#datacat-results").replaceChildren();
		setStatus([`Can't search: ${r.error}`]);
		return;
	}

	showCharacters(r.value.characters, offset > 0);
	if (offset === 0 && r.value.characters.length === 0)
		el("#datacat-results").replaceChildren(placeholderView(query.trim() || options.tagIds.length > 0 || options.blockedTagIds.length > 0 ? "Nothing found" : "Datacat has nothing to show"));

	const { hasMore, nextOffset } = r.value.paging ?? {};
	nextPage = hasMore && typeof nextOffset === "number" ? { query, offset: nextOffset, options } : null;
	more.hidden = !nextPage;
}

async function openLink(raw: string) {
	if (!raw.trim()) return;
	const ref = parseCharacterLink(raw);
	if (!ref) {
		setStatus(["That's not a Janitor or Datacat character link"]);
		return;
	}

	const run = ++listSequence;
	lastQuery = null;
	nextPage = null;
	el("#datacat-more").hidden = true;
	setStatus(null);
	el("#datacat-results").replaceChildren(placeholderView("Looking it up…"));

	const r = await getCharacter(ref);
	if (run !== listSequence) return;
	if (r.success) {
		showCharacters([r.value], false);
		return;
	}

	el("#datacat-results").replaceChildren();
	if (r.status === 404) {
		setStatus([
			"Datacat hasn't indexed this character. ",
			anchor("https://datacat.run/retrieve", "Add it on Datacat"),
			" by its link, then open it here again."
		]);
	} else {
		setStatus([`Can't look it up: ${r.error}`]);
	}
}

function anchor(href: string, text: string) {
	const a = document.createElement("a");
	a.href = href;
	a.target = "_blank";
	a.rel = "noopener";
	a.textContent = text;
	return a;
}

async function importCharacter(character: DatacatCharacter, button: HTMLButtonElement) {
	if (!character.id) return;
	const ref: DatacatRef = { id: character.id, sourceKind: character.sourceKind };
	const caption = button.textContent;
	button.disabled = true;
	button.textContent = "importing…";
	const restore = () => {
		button.disabled = false;
		button.textContent = caption;
	};

	const transfer = await withLease(ref, async lease => {
		const card = await fetchCard(ref, lease);
		if (!card.success) return card;
		// the picture is optional: a card without one is still worth having
		const picture = await fetchAvatar(ref, lease);
		return { success: true as const, value: { card: card.value, picture: picture.success ? picture.value : null } };
	});
	if (!transfer) return restore();
	if (!transfer.success) {
		toast(`can't import ${character.name}: ${transfer.error}`);
		return restore();
	}

	const card = transfer.value.card;
	if (card?.spec !== "chara_card_v2" || !card.data) {
		toast(`can't import ${character.name}: datacat sent something that isn't a character card`);
		return restore();
	}
	const converted = await importDatacatJSON(card, {
		picture: transfer.value.picture,
		author: character.creator?.name ? { name: character.creator.name, url: characterPage(ref) } : undefined,
		description: character.description || undefined
	});
	const saved = await idb.set("scenarios", converted);
	if (!saved.success) {
		toast(`can't save ${character.name} to the library`);
		return restore();
	}

	button.textContent = "imported";
	toast(`${converted.card.title} is in the library now`, { timeoutMS: 3000 });
}

/**
 * Runs a protected transfer with a lease, going through the check first when there's no usable one.
 * Null when the user cancelled the check.
 */
async function withLease<T>(ref: DatacatRef, transfer: (lease: string) => Promise<DatacatResult<T>>): Promise<DatacatResult<T> | null> {
	const stored = usableLease(ref);
	let lease = stored ?? await verify();
	if (!lease) return null;

	let r = await transfer(lease.token);
	if (!r.success && r.verificationRequired && stored) {
		// a stored lease expired or got used up early, or Datacat forgot it: one fresh check
		dropLease();
		lease = await verify();
		if (!lease) return null;
		r = await transfer(lease.token);
	}
	if (!r.success && r.verificationRequired) {
		// a lease straight from the check got turned down: another check would end the same way
		dropLease();
		const reason = r.verificationReason ? ` (${r.verificationReason})` : "";
		return { ...r, error: `datacat didn't accept the lease it just issued${reason}` };
	}
	if (r.success) markLeaseUsed(lease, ref);
	return r;
}

// ---- verify tab ----

/** the imports waiting for the check; several share one */
let verification: { promise: Promise<Lease | null>, resolve: (lease: Lease | null) => void } | null = null;
let challenge: Challenge | null = null;
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let polling = false;

function verify(): Promise<Lease | null> {
	if (verification) return verification.promise;
	verification = revolvers<Lease | null>();
	el<RampikeTabs>("#datacat-tabs").tab = "verify";
	beginChallenge();
	return verification.promise;
}

function finishVerification(lease: Lease | null) {
	clearTimeout(pollTimer);
	challenge = null;
	el<RampikeTabs>("#datacat-tabs").tab = "main";
	const waiting = verification;
	verification = null;
	waiting?.resolve(lease);
}

function verifyStatus(text: string, retry = false) {
	el("#datacat-verify-status").textContent = text;
	el("#datacat-verify-retry").hidden = !retry;
}

async function beginChallenge() {
	clearTimeout(pollTimer);
	challenge = null;
	const openLink = el<HTMLAnchorElement>("#datacat-verify-open");
	openLink.hidden = true;
	verifyStatus("Asking Datacat for a check…");

	const r = await startVerification();
	if (!verification) return;
	if (!r.success) return verifyStatus(`Can't start the check: ${r.error}`, true);

	challenge = r.value;
	openLink.href = r.value.url;
	openLink.hidden = false;
	verifyStatus("Pass the check on Datacat's page, then come back here: the import carries on by itself.");
	schedulePoll(r.value, r.value.intervalMS);
}

function schedulePoll(c: Challenge, delay: number) {
	clearTimeout(pollTimer);
	pollTimer = setTimeout(() => poll(c), delay);
}

async function poll(c: Challenge) {
	if (polling || challenge !== c) return;
	clearTimeout(pollTimer);
	if (Date.now() > c.expiresAt) {
		challenge = null;
		el("#datacat-verify-open").hidden = true;
		return verifyStatus("The check expired.", true);
	}

	polling = true;
	const r = await pollVerification(c);
	polling = false;
	if (challenge !== c) return;

	if (r.success) {
		if (r.value === "pending") return schedulePoll(c, c.intervalMS);
		return finishVerification(r.value);
	}
	if (r.status === 429) return schedulePoll(c, c.intervalMS * 4);
	if (r.status === 0) return schedulePoll(c, c.intervalMS * 2);
	challenge = null;
	el("#datacat-verify-open").hidden = true;
	verifyStatus(r.status === 410 ? "The check expired." : `The check failed: ${r.error}`, true);
}
