import { Chat, Pronouns } from "@root/types";

/*
Text macros shared by scenario definitions, openings and lorebook entries:
{{char}}, {{user}}, {{persona}} and the pronoun set of the user's persona.
*/

const PRON_MACROS: Record<string, keyof Pronouns> = {
	"sub":     "subjective",
	"he":      "subjective",
	"she":     "subjective",
	"they":    "subjective",

	"obj":     "objective",
	"them":    "objective",

	"poss":    "possessiveAdj",
	"their":   "possessiveAdj",

	"poss_p":  "possessivePro",
	"theirs":  "possessivePro",

	"ref":     "reflexive",
	"themselves":"reflexive"
};
const CHAR_NAME_MACRO = "char";
const USER_NAME_MACRO = "user";
export const PERSONA_MACRO = "persona";
const MACROS_MACRO = "macros";

export const MACROS =
`# Macros
## Names
{{char}}
    Character name
{{user}}
    User's persona name
{{persona}}
	User's persona description

## User's persona pronouns:
{{sub}} or {{they}}
    subjective (he/she/they)
{{obj}} or {{them}}
    objective (him/her/them)
{{poss}} or {{their}}
    possessive (his/her/their)
{{poss_p}} or {{theirs}}
    possessive pronoun (his/hers/theirs)
{{ref}} or {{themselves}}
    reflexive (himself/herself/themselves)`;

export type MacroContext = {
	pronouns: Pronouns,
	charName: string,
	userName: string,
	persona: string
};

/** any run of braces around a name: {char}, {{Char}} and {{{char}}} are the same macro */
export const MACRO_RE = /\{+(\w+)\}+/g;

export function runMacros(template: string, context: MacroContext) {
	const subs = {
		[CHAR_NAME_MACRO]: context.charName,
		[USER_NAME_MACRO]: context.userName,
		[PERSONA_MACRO]: context.persona,
		[MACROS_MACRO]: MACROS
	};
	function sigh(m: string) {
		m = m.toLowerCase();
		if (m in PRON_MACROS) {
			return context.pronouns[PRON_MACROS[m]]
		}
		if (m in subs) {
			return subs[m as keyof typeof subs];
		}
		return `{{${m}}}`;
	}
	return template.replace(MACRO_RE, (_, cap) => sigh(cap));
}

export const KNOWN_MACROS = new Set([
	...Object.keys(PRON_MACROS),
	CHAR_NAME_MACRO,
	USER_NAME_MACRO,
	PERSONA_MACRO,
	MACROS_MACRO
]);

/** Macro values of an open chat */
export function macroContext(chat: Chat): MacroContext {
	return {
		pronouns: chat.userPersona.pronouns,
		charName: chat.scenario.name,
		userName: chat.userPersona.name,
		persona: chat.userPersona.description
	};
}
