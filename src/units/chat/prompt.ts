import { ChatMessage, PromptMessage, RemberSettings } from "@root/types";
import { ChatSession, selectedText } from "./session";

/*
Pure prompt builders: session in, PromptMessage[] out. No DOM, no idb, no network.
Every LLM route (roleplay, rEmber, whatever comes next) gets its builder here.
*/

export const REMBER_DEFAULTS: RemberSettings = {
	stride: 40,
	prompt: [
		"provide summary of a text roleplay session described by the user.",
		"update provided state to reflect any changes to it.",
		"format trivia as a list of facts.",
		"stay concise and ignore any info irrelevant to possible future scenarios.",
		"do not provide any commentary, only describe the new state, do not change the format (the headings), do not include the chat history.",
		"follow this format when describing the roleplay state summary:",
		"```",
		"## current location",
		"",
		"## locations and objects",
		"### location example",
		"- example item",
		"- example item",
		"",
		"## noteworthy trivia",
		"",
		"## future plans and promises",
		"",
		"```"
	].join("\n")
};

const SYSTEM_MACRO = "{{system}}";

export type RoleplayOptions = {
	tail: number,
	remberStretch: boolean,
	/** send OOC notes as "OOC: ..." user turns instead of mid-conversation system messages */
	oocAsUser: boolean,
	suffix?: string
};

/**
 * System prompt + history up to (excluding) message index `upTo`,
 * with the latest rEmber summary inserted right before the message it is attached to.
 * A summary attached to message R describes everything before R.
 */
export function roleplayPrompt(session: ChatSession, beforeMid: number, options: RoleplayOptions): PromptMessage[] {
	const messages = session.contents.messages;
	const upTo = messages.findIndex(m => m.id === beforeMid);
	const history = upTo === -1 ? messages : messages.slice(0, upTo);
	const remberAt = history.findLastIndex(m => m.rember);

	let start = options.tail > 0 ? Math.max(0, history.length - options.tail) : 0;
	if (options.remberStretch && remberAt !== -1) start = Math.min(start, remberAt);

	const definition = session.chat.scenario.definition;
	const prompt: PromptMessage[] = [
		system(options.suffix ? `${definition}\n${options.suffix}` : definition)
	];
	for (let i = start; i < history.length; ++i) {
		if (i === remberAt)
			prompt.push(system(`# Roleplay state summary:\n${history[i].rember}`));
		prompt.push(toPrompt(history[i], options.oocAsUser));
	}
	return prompt;
}

/**
 * Asks for a state summary of `scope`, continuing from `previousState` if there is one.
 * The scenario definition is available to the rEmber prompt via {{system}}.
 * OOC notes are left out: they are instructions to the model, not roleplay state.
 */
export function remberPrompt(
	session: ChatSession,
	settings: RemberSettings,
	scope: ChatMessage[],
	previousState: string | null
): PromptMessage[] {
	const names: Record<ChatMessage["from"], string> = {
		user: session.chat.userPersona.name,
		model: session.chat.scenario.name,
		system: ""
	};
	const history = scope
		.filter(m => m.from !== "system")
		.map(m => `## ${names[m.from]}:\n${selectedText(m)}\n\n`)
		.join("\n");

	const payload = [
		...(previousState
			? ["# saved roleplay state", previousState, ""]
			: []
		),
		"# chat history",
		history
	].join("\n");

	// push definition headings one level down so they nest under the prompt's own
	const definition = session.chat.scenario.definition.replace(/^#+/gm, v => `#${v}`);

	return [
		system(settings.prompt.replace(SYSTEM_MACRO, definition)),
		{ role: "user", content: payload }
	];
}

function system(content: string): PromptMessage {
	return { role: "system", content };
}

const OOC_PREFIX = "OOC: ";
function toPrompt(message: ChatMessage, oocAsUser: boolean): PromptMessage {
	if (message.from === "system" && oocAsUser)
		return { role: "user", content: OOC_PREFIX + selectedText(message) };
	return {
		role: message.from === "model" ? "assistant" : message.from,
		content: selectedText(message)
	};
}
