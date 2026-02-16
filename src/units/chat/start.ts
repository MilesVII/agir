import { idb } from "@root/persist";
import { Chat, ChatMessage, Persona, Pronouns, ScenarioCard } from "@root/types";

const PRON_MACROS: Record<string, keyof Pronouns> = {
	"{{sub}}":    "subjective",
	"{{obj}}":    "objective",
	"{{poss}}":   "possessiveAdj",
	"{{poss_p}}": "possessivePro",
	"{{ref}}":    "reflexive"
};
const CHAR_NAME_MACRO = "{{char}}";
const USER_NAME_MACRO = "{{user}}";
const PERSONA_MACRO = "{{persona}}";

export async function start(personaId: string, scenarioId: string, messages?: ChatMessage[]) {
	const [persona, scenario] = await Promise.all([
		idb.get("personas", personaId),
		idb.get("scenarios", scenarioId)
	]);
	if (!persona.success || !scenario.success) return;
	// override imported names
	if (messages) {
		messages.forEach(m => {
			if (m.from === "model") m.name = scenario.value.chat.name;
			if (m.from === "user")  m.name = persona.value.name;
		});
	}

	const preparedScenario = prepareScenario(scenario.value, persona.value);
	const chatId = crypto.randomUUID();
	await Promise.all([
		idb.set("chats", {
			id: chatId,
			lastUpdate: Date.now(),
			messageCount: messages?.length ?? 1,
			scenario: preparedScenario,
			userPersona: persona.value
		}),
		idb.set("chatContents", {
			id: chatId,
			messages: messages ?? [{
				id: 0,
				from: "model",
				name: scenario.value.chat.name,
				rember: null,
				selectedSwipe: 0,
				swipes: preparedScenario.initials
			}]
		})
	]);

	window.location.hash = `play.${chatId}`;
}

function macros(template: string, pronouns: Pronouns, charName: string, userName: string, persona: string) {
	for (const [from, toKey] of Object.entries(PRON_MACROS)) {
		template = template.replaceAll(from, pronouns[toKey]);
	}
	template = template.replaceAll(CHAR_NAME_MACRO, charName);
	template = template.replaceAll(USER_NAME_MACRO, userName);
	template = template.replaceAll(PERSONA_MACRO, persona);
	return template;
}

function prepareScenario(origin: ScenarioCard, persona: Persona): Chat["scenario"] {
	const runMacros = (template: string) => macros(
		template,
		persona.pronouns,
		origin.chat.name, persona.name,
		persona.description
	);
	
	return {
		id: origin.id,
		picture: origin.chat.picture || origin.card.picture,
		name: origin.chat.name || origin.card.title,
		definition: runMacros(origin.chat.definition),
		initials: origin.chat.initials.map(runMacros)
	};
}
