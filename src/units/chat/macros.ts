import { Chat, Pronouns } from "@root/types";

/*
Text macros shared by scenario definitions, openings and lorebook entries:
{{char}}, {{user}}, {{persona}} and the pronoun set of the user's persona.
*/

const PRON_MACROS: Record<string, keyof Pronouns> = {
	"{{sub}}":     "subjective",
	"{{he}}":      "subjective",
	"{{she}}":     "subjective",
	"{{they}}":    "subjective",

	"{{obj}}":     "objective",
	"{{them}}":    "objective",

	"{{poss}}":    "possessiveAdj",
	"{{their}}":   "possessiveAdj",

	"{{poss_p}}":  "possessivePro",
	"{{theirs}}":  "possessivePro",

	"{{ref}}":     "reflexive",
	"{{themselves}}":"reflexive"
};
const CHAR_NAME_MACRO = "{{char}}";
const USER_NAME_MACRO = "{{user}}";
const PERSONA_MACRO = "{{persona}}";
const MACROS_MACRO = "{{macros}}";

const MACROS =
`# Macros
## Names
{{char}}
    Character name
{{user}}
    User's persona name

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

export function runMacros(template: string, context: MacroContext) {
	for (const [from, toKey] of Object.entries(PRON_MACROS)) {
		template = template.replaceAll(from, context.pronouns[toKey]);
	}
	template = template.replaceAll(CHAR_NAME_MACRO, context.charName);
	template = template.replaceAll(USER_NAME_MACRO, context.userName);
	template = template.replaceAll(PERSONA_MACRO, context.persona);
	template = template.replaceAll(MACROS_MACRO, MACROS);
	return template;
}

/** Macro values of an open chat */
export function macroContext(chat: Chat): MacroContext {
	return {
		pronouns: chat.userPersona.pronouns,
		charName: chat.scenario.name,
		userName: chat.userPersona.name,
		persona: chat.userPersona.description
	};
}
