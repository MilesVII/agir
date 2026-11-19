import { local } from "@root/persist";
import { nothrow, nothrowAsync, unique } from "@root/utils";
import type { DatacatCard } from "./datacat";

/*
Datacat Client API v1 (https://datacat.run/client-api-v1.openapi.json), called straight from the browser:
the Client ID is public, Datacat answers CORS for any origin, and its rate limits are per IP, so every user gets their own.

Browsing (search, profiles) needs only the Client ID. Card and picture downloads need a verification lease:
the user passes a check on Datacat's own page, and the lease it gives covers a few characters for half an hour.
The lease is bound to this browser's installation ID and kept in localStorage, so a reload doesn't ask again.
*/

export const DATACAT_ORIGIN = "https://datacat.run";
const BASE = `${DATACAT_ORIGIN}/api/client/v1`;
/** Ägir's approved integration; public by design (never put a developer token, dca1_, here) */
const CLIENT_ID = "dca_na8fy-hryenqwaaioa8_crju";
/** header values are bytes, so no Ä */
const CLIENT_NAME = "Aegir";
export const PAGE_SIZE = 24;
const SEARCH_CHARS = 120;
const TAG_SEARCH_CHARS = 80;
/** a lease this close to expiry isn't worth starting a download with */
const LEASE_MARGIN_MS = 30_000;

export type DatacatSourceKind = "janitor" | "janitor_core" | "jannyai" | "saucepan" | "direct_upload";
const SOURCE_KINDS: DatacatSourceKind[] = ["janitor_core", "janitor", "jannyai", "saucepan", "direct_upload"];

export type DatacatCharacter = {
	/** null for records Datacat can't hand out */
	id: string | null,
	name: string,
	chatName?: string | null,
	creator: { id: string | null, ref: string | null, sourceKind: string, name: string },
	description: string,
	/** display names, custom tags included; search results come without tags */
	tags: string[],
	/** slugs and custom tags, for matching hidden tags */
	tagSlugs: string[],
	image: { status: "ready" | "pending", url: string | null },
	avatarUrl?: string | null,
	sourceKind: DatacatSourceKind,
	nsfw: boolean,
	stats: { chats: number, messages: number, messagesPerChat: number | null },
	totalTokens?: number | null,
	score?: number | null,
	publishedAt?: string | null,
	updatedAt?: string | null,
	/** profiles only */
	creatorNotes?: string | null
};
export type DatacatPage = {
	characters: DatacatCharacter[],
	paging: { hasMore: boolean, nextOffset: number | null }
};
export type DatacatRef = { id: string, sourceKind: DatacatSourceKind };

export const SORTS = {
	score:             "score",
	fresh:             "freshest",
	chat_count:        "chats",
	messages_per_chat: "messages per chat",
	first_published:   "first published"
} as const;
export type DatacatSort = keyof typeof SORTS;
/** with required tags, Datacat ignores the text: its text search doesn't look at tags */
export type SearchOptions = { sort: DatacatSort, tagIds: number[], blockedTagIds: number[] };

export type DatacatTag = { id: number, name: string, slug: string, groupId: number | null, count: number };
/** Datacat excludes at most this many tags per search */
export const MAX_BLOCKED_TAGS = 50;
/** and requires at most this many */
export const MAX_REQUIRED_TAGS = 24;

export type DatacatFailure = {
	success: false,
	status: number,
	error: string,
	/** Datacat's machine-readable code */
	code: string,
	/** the lease is missing, expired or used up */
	verificationRequired: boolean,
	/** why Datacat turned the lease down, e.g. "missing" */
	verificationReason?: string
};
export type DatacatResult<T> = { success: true, value: T } | DatacatFailure;

/** Datacat's own page for a character: it credits the creator and links to the source */
export function characterPage(ref: DatacatRef) {
	return `${DATACAT_ORIGIN}/characters/recent/${ref.sourceKind}/${ref.id}`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
/**
 * A Janitor (or jannyai mirror) character link, a Datacat character link, or a bare id.
 * Janitor ids double as Datacat ids for characters Datacat indexed from Janitor.
 */
export function parseCharacterLink(raw: string): DatacatRef | null {
	const text = raw.trim().toLowerCase();
	const datacat = text.match(new RegExp(`datacat\\.run/.*?/(${SOURCE_KINDS.join("|")})/(${UUID})`));
	if (datacat) return { sourceKind: datacat[1] as DatacatSourceKind, id: datacat[2] };

	const id = text.match(new RegExp(UUID))?.[0];
	if (!id) return null;
	const bare = text === id;
	const janitor = /(^|\/\/|\.)(janitorai|jannyai)\.com\//.test(text);
	return bare || janitor ? { sourceKind: "janitor", id } : null;
}

function installationId() {
	let id = local.get("datacatInstallation");
	if (!id) {
		id = `aegir-${crypto.randomUUID()}`;
		local.set("datacatInstallation", id);
	}
	return id;
}

function failure(status: number, error: string, code = "", verificationRequired = false): DatacatFailure {
	return { success: false, status, error, code, verificationRequired };
}

async function request(path: string, init: { method?: "GET" | "POST", body?: object, lease?: string } = {}): Promise<DatacatResult<Response>> {
	const headers: Record<string, string> = {
		"X-Datacat-Client-Id": CLIENT_ID,
		"X-Datacat-Client": CLIENT_NAME
	};
	if (init.body) headers["Content-Type"] = "application/json";
	if (init.lease) {
		headers["X-Datacat-Verification-Lease"] = init.lease;
		// the lease is bound to the installation that passed the check; the docs don't say how a transfer names it,
		// but Datacat's CORS allows this header, and without it a fresh lease comes back as "missing"
		headers["X-Datacat-Installation-Id"] = installationId();
	}

	const response = await nothrowAsync(fetch(`${BASE}${path}`, {
		method: init.method ?? "GET",
		headers,
		body: init.body ? JSON.stringify(init.body) : undefined
	}));
	if (!response.success) return failure(0, "can't reach datacat");
	const r = response.value;
	if (r.ok) return { success: true, value: r };

	const body = await nothrowAsync(r.json());
	const e = body.success && body.value && typeof body.value === "object" ? body.value : {};
	const code = typeof e.error === "string" ? e.error : "";
	let message = typeof e.message === "string" && e.message ? e.message : `datacat answered ${r.status}`;
	if (r.status === 429) {
		const after = parseInt(r.headers.get("Retry-After") ?? "", 10);
		message = isNaN(after)
			? "datacat's rate limit is reached, try again in a few minutes"
			: `datacat's rate limit is reached, try again in ${after < 90 ? `${after} seconds` : `${Math.ceil(after / 60)} minutes`}`;
	}
	const f = failure(r.status, message, code, e.verificationRequired === true);
	if (typeof e.verificationReason === "string") f.verificationReason = e.verificationReason;
	return f;
}

async function json<T>(path: string, init?: Parameters<typeof request>[1]): Promise<DatacatResult<T>> {
	const r = await request(path, init);
	if (!r.success) return r;
	const body = await nothrowAsync(r.value.json());
	if (!body.success) return failure(r.value.status, "datacat sent a malformed answer");
	return { success: true, value: body.value };
}

// ---- browsing ----

/** the spec says tags are strings, but profiles send objects, and custom tags separately */
type RawTag = string | { name?: string, slug?: string } | null;
type RawCharacter = Omit<DatacatCharacter, "tags" | "tagSlugs"> & { tags?: RawTag[], customTags?: string[] | null };

export function tagText(tag: RawTag, prefer: "name" | "slug" = "name") {
	if (typeof tag === "string") return tag;
	return (prefer === "name" ? tag?.name ?? tag?.slug : tag?.slug ?? tag?.name) ?? "";
}
function normalize(raw: RawCharacter): DatacatCharacter {
	const tags = raw.tags ?? [];
	const custom = (raw.customTags ?? []).filter(t => typeof t === "string");
	return {
		...raw,
		tags:     unique([...tags.map(t => tagText(t)), ...custom].filter(t => t)),
		tagSlugs: unique([...tags.map(t => tagText(t, "slug")), ...custom].filter(t => t))
	};
}

/** an empty query lists the whole catalog in the picked order */
export async function searchCharacters(query: string, options: SearchOptions, offset = 0): Promise<DatacatResult<DatacatPage>> {
	const q = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), sort: options.sort });
	const required = options.tagIds.slice(0, MAX_REQUIRED_TAGS);
	const search = query.trim().slice(0, SEARCH_CHARS);
	if (required.length > 0) q.set("tagIds", required.join(","));
	else if (search) q.set("search", search);
	const blocked = options.blockedTagIds.slice(0, MAX_BLOCKED_TAGS);
	if (blocked.length > 0) q.set("blockedTagIds", blocked.join(","));
	const r = await json<{ characters: RawCharacter[], paging: DatacatPage["paging"] }>(`/characters?${q}`);
	if (!r.success) return r;
	return { success: true, value: { characters: (r.value.characters ?? []).map(normalize), paging: r.value.paging } };
}

/** 404 means Datacat hasn't indexed the character (or it's gone from the source) */
export async function getCharacter(ref: DatacatRef): Promise<DatacatResult<DatacatCharacter>> {
	const q = new URLSearchParams({ sourceKind: ref.sourceKind });
	const r = await json<{ character: RawCharacter }>(`/characters/${ref.id}?${q}`);
	return r.success ? { success: true, value: normalize(r.value.character) } : r;
}

/** one page of tags, most used first; Datacat hands out about 240 per page whatever the limit, and a search rarely needs more */
export async function listTags(search = ""): Promise<DatacatResult<DatacatTag[]>> {
	const q = new URLSearchParams({ limit: "250", sort: "count" });
	const text = search.trim().slice(0, TAG_SEARCH_CHARS);
	if (text) q.set("search", text);
	const r = await json<{ tags: DatacatTag[] }>(`/tags?${q}`);
	if (!r.success) return r;
	return { success: true, value: (r.value.tags ?? []).filter(t => typeof t?.id === "number" && t.name) };
}

// ---- protected transfers ----

export function fetchCard(ref: DatacatRef, lease: string) {
	const q = new URLSearchParams({ sourceKind: ref.sourceKind });
	return json<DatacatCard>(`/characters/${ref.id}/card?${q}`, { lease });
}

export async function fetchAvatar(ref: DatacatRef, lease: string): Promise<DatacatResult<Blob>> {
	const q = new URLSearchParams({ sourceKind: ref.sourceKind });
	const r = await request(`/characters/${ref.id}/avatar?${q}`, { lease });
	if (!r.success) return r;
	const blob = await nothrowAsync(r.value.blob());
	return blob.success ? { success: true, value: blob.value } : failure(r.value.status, "can't read the picture");
}

// ---- verification ----

export type Lease = {
	token: string,
	expiresAt: number,
	maxCharacters: number,
	/** `${sourceKind}:${id}` of the characters downloaded with it */
	used: string[]
};
export type Challenge = {
	id: string,
	deviceCode: string,
	/** Datacat's page with the check; the user opens it */
	url: string,
	expiresAt: number,
	intervalMS: number
};

export function refKey(ref: DatacatRef) {
	return `${ref.sourceKind}:${ref.id}`;
}

function loadLease(): Lease | null {
	const raw = local.get("datacatLease");
	if (!raw) return null;
	const parsed = nothrow(() => JSON.parse(raw) as Lease);
	if (!parsed.success || typeof parsed.value?.token !== "string") return null;
	return parsed.value;
}
function saveLease(lease: Lease | null) {
	local.set("datacatLease", lease ? JSON.stringify(lease) : "");
}
export function dropLease() {
	saveLease(null);
}

/** a stored lease that can still download this character, if any */
export function usableLease(ref: DatacatRef): Lease | null {
	const lease = loadLease();
	if (!lease) return null;
	if (lease.expiresAt - LEASE_MARGIN_MS < Date.now()) return null;
	const key = refKey(ref);
	if (!lease.used.includes(key) && lease.used.length >= lease.maxCharacters) return null;
	return lease;
}
export function markLeaseUsed(lease: Lease, ref: DatacatRef) {
	const key = refKey(ref);
	const stored = loadLease();
	if (stored?.token !== lease.token || stored.used.includes(key)) return;
	stored.used.push(key);
	saveLease(stored);
}

export async function startVerification(): Promise<DatacatResult<Challenge>> {
	const r = await json<{
		verificationId: string,
		deviceCode: string,
		verificationUriComplete: string,
		expiresIn: number,
		interval: number
	}>("/verifications", {
		method: "POST",
		// the spec's examples say "character_transfer", but the server only takes what /capabilities lists
		body: { installationId: installationId(), clientName: CLIENT_NAME, action: "character-import" }
	});
	if (!r.success) return r;
	return {
		success: true,
		value: {
			id: r.value.verificationId,
			deviceCode: r.value.deviceCode,
			url: r.value.verificationUriComplete,
			expiresAt: Date.now() + (r.value.expiresIn || 300) * 1000,
			intervalMS: Math.max(r.value.interval || 3, 2) * 1000
		}
	};
}

/**
 * Tries to exchange the challenge for a lease, storing it on success; "pending" until the user passes the check on Datacat's page.
 * Polls the exchange itself, device-flow style: it answers 428 VERIFICATION_PENDING until then,
 * while the public status route kept saying "pending" after the check passed.
 */
export async function pollVerification(challenge: Challenge): Promise<DatacatResult<"pending" | Lease>> {
	const r = await json<{ leaseToken: string, expiresAt: string, maxUniqueCharacters: number }>(`/verifications/${challenge.id}/token`, {
		method: "POST",
		body: { deviceCode: challenge.deviceCode, installationId: installationId() }
	});
	if (!r.success) {
		if (r.status === 428 || r.code === "VERIFICATION_PENDING") return { success: true, value: "pending" };
		return r;
	}
	const expiresAt = Date.parse(r.value.expiresAt);
	const lease: Lease = {
		token: r.value.leaseToken,
		expiresAt: isNaN(expiresAt) ? Date.now() + 30 * 60_000 : expiresAt,
		maxCharacters: r.value.maxUniqueCharacters || 20,
		used: []
	};
	saveLease(lease);
	return { success: true, value: lease };
}
