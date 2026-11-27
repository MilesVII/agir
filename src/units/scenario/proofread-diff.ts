import { diffArrays } from "diff";
import { PromptMessage } from "@root/types";
import { PROOFREAD_DIFF_DEFAULT_PROMPT } from "@units/settings/misc";

/*
Diff mode of the proofreader. Asking a model for offsets or a list of edits is fragile, so it is asked
for the corrected text of every section instead, and the changes are found here by diffing the sections
against what was sent. Pure functions: no DOM, no storage.
*/

export type ProofreadSection = {
	/** tag the section is wrapped in, both ways: "definition", "opening_1", ... */
	key: string,
	label: string,
	/** the text as sent, trimmed */
	base: string
};

export type ProofreadChange = {
	/** offset of `before` in the section's base text */
	start: number,
	before: string,
	after: string
};

/** system prompt plus every section wrapped in its own tag, which the answer has to repeat */
export function diffProofreadPrompt(systemPrompt: string, sections: ProofreadSection[]): PromptMessage[] {
	const content = sections
		.map(s => `<${s.key}>\n${s.base}\n</${s.key}>`)
		.join("\n\n");
	return [
		{ role: "system", content: systemPrompt.trim() || PROOFREAD_DIFF_DEFAULT_PROMPT },
		{ role: "user", content }
	];
}

/** corrected text of each section; null for sections the answer has no complete tag pair for */
export function parseProofreadAnswer(answer: string, sections: ProofreadSection[]) {
	const found = new Map<string, string | null>();
	for (const s of sections) {
		const m = answer.match(new RegExp(`<${s.key}>([\\s\\S]*?)</${s.key}>`));
		found.set(s.key, m ? stripFence(m[1].trim(), s.base) : null);
	}
	return found;
}

/** some models wrap the text in a code fence; it is dropped unless the original had one too */
function stripFence(text: string, base: string) {
	if (base.startsWith("```")) return text;
	const m = text.match(/^```[\w-]*\n([\s\S]*?)\n```$/);
	return m ? m[1].trim() : text;
}

/**
 * Changes between two versions of a text, word by word. Words are runs of non-whitespace, punctuation
 * included, so "teh" -> "the" and "witch" -> "witch." are one change each. Changes separated only by
 * spaces on the same line are merged: a rewritten phrase is one change, not one per word.
 */
export function proofreadChanges(base: string, fixed: string): ProofreadChange[] {
	const parts = diffArrays(tokenize(base), tokenize(fixed));

	const changes: ProofreadChange[] = [];
	let offset = 0;
	let current: ProofreadChange | null = null;
	/** unchanged whitespace after `current`, merged into it if another change follows */
	let gap = "";
	for (const part of parts) {
		const text = part.value.join("");
		if (!part.added && !part.removed) {
			if (current && /^[^\S\n]+$/.test(text)) {
				gap = text;
			} else {
				current = null;
				gap = "";
			}
			offset += text.length;
			continue;
		}
		if (!current) {
			current = { start: offset, before: "", after: "" };
			changes.push(current);
		} else if (gap) {
			current.before += gap;
			current.after += gap;
			gap = "";
		}
		if (part.removed) {
			current.before += text;
			offset += text.length;
		} else {
			current.after += text;
		}
	}
	return changes.map(trimShared);
}

/** whitespace both versions start or end with is context, not part of the change */
function trimShared(c: ProofreadChange): ProofreadChange {
	let { start, before, after } = c;
	while (before && after && before[0] === after[0] && /\s/.test(before[0])) {
		before = before.slice(1);
		after = after.slice(1);
		++start;
	}
	while (before && after && before.at(-1) === after.at(-1) && /\s/.test(before.at(-1)!)) {
		before = before.slice(0, -1);
		after = after.slice(0, -1);
	}
	return { start, before, after };
}

function tokenize(text: string) {
	return text.split(/(\s+)/).filter(t => t);
}
