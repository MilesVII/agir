import { idb } from "@root/persist";
import { Chat, ChatMessage, Persona, ScenarioCard } from "@root/types";
import { REMBER_DEFAULTS } from "./prompt";
import { LORE_DEFAULTS } from "./lore";
import { runMacros } from "./macros";
import { estimateTokenCount } from "tokenx";

export async function start(personaId: string, scenarioId: string, messages?: ChatMessage[]) {
	const [persona, scenario] = await Promise.all([
		idb.get("personas", personaId),
		idb.get("scenarios", scenarioId)
	]);
	if (!persona.success || !scenario.success) return;
	// override imported names
	if (messages) {
		messages = messages.map(m => {
			if (m.from === "model") m.name = scenario.value.chat.name;
			if (m.from === "user")  m.name = persona.value.name;
			return m;
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
			userPersona: persona.value,
			messageChunks: [],
			rember: REMBER_DEFAULTS,
			folder: null,
			lorebooks: scenario.value.lorebooks ?? [],
			lore: LORE_DEFAULTS
		}),
		idb.set("chatContents", {
			id: chatId,
			messages: messages ?? [{
				id: 0,
				from: "model",
				name: scenario.value.chat.name || scenario.value.card.title,
				rember: null,
				selectedSwipe: 0,
				swipes: preparedScenario.initials
			}]
		})
	]);

	window.location.hash = `play.${chatId}`;
}

function prepareScenario(origin: ScenarioCard, persona: Persona): Chat["scenario"] {
	const context = {
		pronouns: persona.pronouns,
		charName: origin.chat.name,
		userName: persona.name,
		persona: persona.description
	};
	const expand = (template: string) => runMacros(template, context);

	const definition = expand(origin.chat.definition);

	return {
		id: origin.id,
		picture: origin.chat.picture || origin.card.picture,
		name: origin.chat.name || origin.card.title,
		definition,
		initials: origin.chat.initials.map(expand),
		tokenCount: estimateTokenCount(definition)
	};
}
