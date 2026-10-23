import { Lorebook, LorebookEntry, LoreLogic, LorePosition, PromptRole, Result } from "@root/types";
import { nothrow, nothrowAsync, sha1Hex } from "@root/utils";

/*
Lorebook importers. Two source formats are understood:
- `character_book` of a Character Card V2 (datacat exports embed one)
- SillyTavern world info exports (an `entries` map in ST's own field names)
Both normalize to the Lorebook type. Anything missing gets SillyTavern's defaults.
A book's id is a hash of its keys and contents, so the same book imported twice is detected
and an updated version shows up as a different id.
*/

/** Character Card V2 `character_book` */
export type CharacterBook = {
	name?: string,
	description?: string,
	scan_depth?: number,
	token_budget?: number,
	recursive_scanning?: boolean,
	extensions?: Record<string, unknown>,
	entries: CharacterBookEntry[]
};
type CharacterBookEntry = {
	keys: string[],
	secondary_keys?: string[],
	selective?: boolean,
	content: string,
	enabled: boolean,
	insertion_order: number,
	case_sensitive?: boolean,
	name?: string,
	comment?: string,
	priority?: number,
	id?: number,
	constant?: boolean,
	position?: "before_char" | "after_char",
	extensions?: Record<string, any>
};

/** SillyTavern world info export */
type WorldInfo = {
	name?: string,
	entries: Record<string, WorldInfoEntry> | WorldInfoEntry[]
};
type WorldInfoEntry = {
	uid: number,
	key: string[],
	keysecondary?: string[],
	comment?: string,
	content: string,
	constant?: boolean,
	selective?: boolean,
	selectiveLogic?: number,
	order?: number,
	position?: number,
	disable?: boolean,
	depth?: number,
	role?: number | null,
	caseSensitive?: boolean | null,
	matchWholeWords?: boolean | null,
	excludeRecursion?: boolean,
	preventRecursion?: boolean,
	scanDepth?: number | null
};

// SillyTavern defaults
const ST_LOGIC: LoreLogic[] = ["andAny", "notAll", "notAny", "andAll"];
const ST_ROLE: PromptRole[] = ["system", "user", "assistant"];
const ST_DEPTH = 4;
const ST_ORDER = 100;
const BOOK_DEFAULTS = {
	recursive: true,
	caseSensitive: false,
	wholeWords: true
};

/** ST position codes: 0 before character, 1 after, 2-3 author's note, 4 at depth, 5-6 example messages */
function stPosition(code: number | undefined, fallback: LorePosition): LorePosition {
	if (code === undefined || code === null) return fallback;
	if (code === 0) return "before";
	if (code === 4) return "depth";
	return "after";
}
function stLogic(code: number | undefined | null): LoreLogic {
	return ST_LOGIC[code ?? 0] ?? "andAny";
}
function stRole(code: number | undefined | null): PromptRole {
	return ST_ROLE[code ?? 0] ?? "system";
}

export async function fromCharacterBook(book: CharacterBook, fallbackName: string): Promise<Lorebook> {
	const entries = (book.entries ?? []).map((e, ix): LorebookEntry => {
		const ext = e.extensions ?? {};
		const keys = e.keys ?? [];
		return {
			id: e.id ?? ix,
			name: e.name || e.comment || keys[0] || `#${ix}`,
			keys,
			secondaryKeys: e.selective ? (e.secondary_keys ?? []) : [],
			logic: stLogic(ext.selectiveLogic ?? ext.selective_logic),
			content: e.content ?? "",
			enabled: e.enabled !== false,
			constant: !!e.constant,
			order: e.insertion_order ?? ST_ORDER,
			position: stPosition(ext.position, e.position === "after_char" ? "after" : "before"),
			depth: ext.depth ?? ST_DEPTH,
			role: stRole(ext.role),
			caseSensitive: e.case_sensitive ?? null,
			wholeWords: ext.match_whole_words ?? ext.matchWholeWords ?? null,
			excludeRecursion: !!(ext.exclude_recursion ?? ext.excludeRecursion),
			preventRecursion: !!(ext.prevent_recursion ?? ext.preventRecursion),
			scanDepth: ext.scan_depth ?? ext.scanDepth ?? null
		};
	});
	return await finalize({
		name: book.name || fallbackName,
		scanDepth: book.scan_depth ?? null,
		tokenBudget: book.token_budget ?? null,
		recursive: book.recursive_scanning ?? BOOK_DEFAULTS.recursive
	}, entries);
}

export async function fromWorldInfo(info: WorldInfo, fallbackName: string): Promise<Lorebook> {
	const raw = Array.isArray(info.entries) ? info.entries : Object.values(info.entries ?? {});
	const entries = raw.map((e, ix): LorebookEntry => {
		const keys = e.key ?? [];
		return {
			id: e.uid ?? ix,
			name: e.comment || keys[0] || `#${ix}`,
			keys,
			secondaryKeys: e.selective ? (e.keysecondary ?? []) : [],
			logic: stLogic(e.selectiveLogic),
			content: e.content ?? "",
			enabled: !e.disable,
			constant: !!e.constant,
			order: e.order ?? ST_ORDER,
			position: stPosition(e.position, "before"),
			depth: e.depth ?? ST_DEPTH,
			role: stRole(e.role),
			caseSensitive: e.caseSensitive ?? null,
			wholeWords: e.matchWholeWords ?? null,
			excludeRecursion: !!e.excludeRecursion,
			preventRecursion: !!e.preventRecursion,
			scanDepth: e.scanDepth ?? null
		};
	});
	return await finalize({
		name: info.name || fallbackName,
		scanDepth: null,
		tokenBudget: null,
		recursive: BOOK_DEFAULTS.recursive
	}, entries);
}

async function finalize(book: Pick<Lorebook, "name" | "scanDepth" | "tokenBudget" | "recursive">, entries: LorebookEntry[]): Promise<Lorebook> {
	const fingerprint = JSON.stringify(entries.map(e => [e.keys, e.secondaryKeys, e.content]));
	return {
		id: await sha1Hex(fingerprint),
		enabled: true,
		caseSensitive: BOOK_DEFAULTS.caseSensitive,
		wholeWords: BOOK_DEFAULTS.wholeWords,
		...book,
		entries
	};
}

/** Reads a lorebook from a world info export, a standalone V2 book, or a whole V2 card */
export async function parseLorebookFile(file: File): Promise<Result<Lorebook, string>> {
	const text = await nothrowAsync(file.text());
	if (!text.success) return { success: false, error: "can't read the file" };
	const parsed = nothrow<any>(() => JSON.parse(text.value));
	if (!parsed.success) return { success: false, error: "the file is not valid JSON" };

	const name = file.name.replace(/\.json$/i, "").replace(/_?sillytavern_lorebook$/i, "");
	const json = parsed.value;
	if (json?.data?.character_book?.entries)
		return { success: true, value: await fromCharacterBook(json.data.character_book, json.data.name ?? name) };
	if (json?.entries) {
		const items = Array.isArray(json.entries) ? json.entries : Object.values(json.entries);
		const first = items[0] as any;
		if (!first) return { success: false, error: "the lorebook has no entries" };
		if ("keys" in first) return { success: true, value: await fromCharacterBook(json, name) };
		if ("key" in first)  return { success: true, value: await fromWorldInfo(json, name) };
	}
	return { success: false, error: "this doesn't look like a lorebook" };
}
