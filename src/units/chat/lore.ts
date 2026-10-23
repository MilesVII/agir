import { estimateTokenCount } from "tokenx";
import { Lorebook, LorebookEntry, LoreSettings, PromptRole } from "@root/types";
import { ChatSession, selectedText } from "./session";
import { macroContext, runMacros } from "./macros";

/*
Lorebook activation, following SillyTavern's world info rules:
- entries fire when a key appears in the last N story messages (the latest rEmber summary always counts)
- secondary keys refine that with AND ANY / NOT ALL / NOT ANY / AND ALL
- constant entries always fire
- fired contents can fire further entries (recursion) unless an entry opts out
- a token budget keeps the lore from eating the context, entries with a higher order are kept first
Pure data in, groups of text out; prompt.ts decides where each group lands.
*/

export const LORE_DEFAULTS: LoreSettings = {
	scanDepth: 2,
	tokenBudget: 2048
};
const MAX_RECURSION = 10;

export type ActivatedEntry = {
	book: string,
	entry: LorebookEntry,
	content: string,
	tokens: number
};
export type LoreActivation = {
	before: string[],
	after: string[],
	atDepth: { depth: number, role: PromptRole, content: string }[],
	activated: ActivatedEntry[],
	/** entries that fired but did not fit the budget */
	dropped: number,
	tokens: number
};

export function loreSettingsOf(session: ChatSession): LoreSettings {
	return session.chat.lore ?? LORE_DEFAULTS;
}

type Candidate = { book: Lorebook, entry: LorebookEntry };

/** Finds the lore triggered by the story before message `beforeMid`, or null when no book is attached */
export function activateLore(session: ChatSession, beforeMid: number): LoreActivation | null {
	const books = (session.chat.lorebooks ?? []).filter(b => b.enabled);
	if (books.length === 0) return null;

	const settings = loreSettingsOf(session);
	const messages = session.contents.messages;
	const upTo = messages.findIndex(m => m.id === beforeMid);
	const history = (upTo === -1 ? messages : messages.slice(0, upTo)).filter(m => m.from !== "system");
	const summary = history.findLast(m => m.rember)?.rember ?? "";
	const macros = macroContext(session.chat);

	const buffers = new Map<number, string>();
	const buffer = (depth: number) => {
		let text = buffers.get(depth);
		if (text === undefined) {
			text = [...history.slice(-Math.max(1, depth)).map(selectedText), summary].join("\n");
			buffers.set(depth, text);
		}
		return text;
	};
	const expand = (c: Candidate) => runMacros(c.entry.content, macros);

	const candidates: Candidate[] = books.flatMap(book =>
		book.entries.filter(e => e.enabled).map(entry => ({ book, entry }))
	);
	const activated = new Map<Candidate, string>();

	for (const c of candidates) {
		if (c.entry.constant) {
			activated.set(c, expand(c));
			continue;
		}
		const depth = c.entry.scanDepth ?? c.book.scanDepth ?? settings.scanDepth;
		if (matches(c, buffer(depth))) activated.set(c, expand(c));
	}

	// recursion: what fired can fire more
	let fresh = [...activated.keys()];
	for (let pass = 0; pass < MAX_RECURSION && fresh.length > 0; ++pass) {
		const text = fresh
			.filter(c => c.book.recursive && !c.entry.preventRecursion)
			.map(c => activated.get(c)!)
			.join("\n");
		if (!text) break;
		fresh = candidates.filter(c =>
			!activated.has(c) && c.book.recursive && !c.entry.excludeRecursion && matches(c, text)
		);
		fresh.forEach(c => activated.set(c, expand(c)));
	}

	// budget: higher order first; a book's own budget caps its share of the chat's
	const kept: ActivatedEntry[] = [];
	const bookTokens = new Map<string, number>();
	let tokens = 0;
	let dropped = 0;
	for (const c of [...activated.keys()].sort((a, b) => b.entry.order - a.entry.order)) {
		const content = activated.get(c)!;
		const cost = estimateTokenCount(content);
		const bookTotal = (bookTokens.get(c.book.id) ?? 0) + cost;
		const overBudget = tokens + cost > settings.tokenBudget
			|| (c.book.tokenBudget !== null && bookTotal > c.book.tokenBudget);
		if (overBudget && !c.entry.constant) {
			++dropped;
			continue;
		}
		tokens += cost;
		bookTokens.set(c.book.id, bookTotal);
		kept.push({ book: c.book.name, entry: c.entry, content, tokens: cost });
	}

	// placement: lower order ends up higher in the prompt
	kept.sort((a, b) => a.entry.order - b.entry.order);
	return {
		before:  kept.filter(k => k.entry.position === "before").map(k => k.content),
		after:   kept.filter(k => k.entry.position === "after").map(k => k.content),
		atDepth: kept.filter(k => k.entry.position === "depth").map(k => ({ depth: k.entry.depth, role: k.entry.role, content: k.content })),
		activated: kept,
		dropped,
		tokens
	};
}

function matches({ book, entry }: Candidate, text: string) {
	const caseSensitive = entry.caseSensitive ?? book.caseSensitive;
	const wholeWords = entry.wholeWords ?? book.wholeWords;
	const hit = (key: string) => keyPattern(key, caseSensitive, wholeWords).test(text);

	if (!entry.keys.some(hit)) return false;
	if (entry.secondaryKeys.length === 0) return true;

	const any = entry.secondaryKeys.some(hit);
	const all = entry.secondaryKeys.every(hit);
	switch (entry.logic) {
		case "andAny": return any;
		case "andAll": return all;
		case "notAny": return !any;
		case "notAll": return !all;
	}
}

const patterns = new Map<string, RegExp>();
function keyPattern(key: string, caseSensitive: boolean, wholeWords: boolean) {
	const flags = "u" + (caseSensitive ? "" : "i");
	const cacheKey = `${flags}/${wholeWords}/${key}`;
	let pattern = patterns.get(cacheKey);
	if (!pattern) {
		const escaped = key.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		pattern = new RegExp(wholeWords ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])` : escaped, flags);
		patterns.set(cacheKey, pattern);
	}
	return pattern;
}

// what fired on the last prompt, for the chat's lore indicator

type LoreListener = (activation: LoreActivation | null) => void;
let last: LoreActivation | null = null;
const listeners: LoreListener[] = [];

export function reportLore(activation: LoreActivation | null) {
	last = activation;
	listeners.forEach(l => l(activation));
}
export function lastLore() {
	return last;
}
export function onLore(listener: LoreListener) {
	listeners.push(listener);
}
