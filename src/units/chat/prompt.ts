import { ChatMessage, IllustrateSettings, PromptMessage, RemberSettings } from "@root/types";
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

export const ILLUSTRATE_DEFAULTS: IllustrateSettings = {
	summaryPrompt: [
		"describe the current scene of the text roleplay session provided by the user as a single visual snapshot.",
		"include only what a camera would capture right now: the location and its notable visible objects, time of day, weather and lighting, every character present with their appearance, clothing, pose, facial expression and position relative to each other.",
		"leave out backstory, dialogue, thoughts, intentions, absent characters, other locations and anything that happened earlier.",
		"if a saved roleplay state is provided, use it only to recall the current location and the appearance of present characters.",
		"write plain prose in present tense, at most 150 words, no headings, no commentary."
	].join("\n"),
	tagsPrompt: [
		"convert the scene description provided by the user into a prompt for a Stable Diffusion model running in ComfyUI.",
		"output a single line of comma-separated booru-style tags, most important first: subject count (1girl, 1boy, 2girls...), each character's appearance, clothing, pose and expression, then the setting, lighting, composition and camera angle, then quality tags (masterpiece, best quality, highly detailed).",
		"use concrete, short tags, no sentences, no character names, no negative prompt, no explanations, nothing but the tag list."
	].join("\n")
};

const SYSTEM_MACRO = "{{system}}";

export type RoleplayOptions = {
	tail: number,
	remberStretch: boolean,
	suffix?: string
};

/**
 * System prompt + history up to (excluding) message index `upTo`,
 * with the latest rEmber summary inserted right before the message it is attached to.
 * A summary attached to message R describes everything before R.
 */
export function roleplayPrompt(session: ChatSession, upTo: number, options: RoleplayOptions): PromptMessage[] {
	const history = session.contents.messages.slice(0, upTo);
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
		prompt.push(toPrompt(history[i]));
	}
	return prompt;
}

/**
 * Asks for a state summary of `scope`, continuing from `previousState` if there is one.
 * The scenario definition is available to the rEmber prompt via {{system}}.
 */
export function remberPrompt(
	session: ChatSession,
	settings: RemberSettings,
	scope: ChatMessage[],
	previousState: string | null
): PromptMessage[] {
	// push definition headings one level down so they nest under the prompt's own
	const definition = session.chat.scenario.definition.replace(/^#+/gm, v => `#${v}`);

	return [
		system(settings.prompt.replace(SYSTEM_MACRO, definition)),
		user(historyPayload(session, scope, previousState))
	];
}

/**
 * Asks for a visual description of the current scene: everything since the latest
 * rEmber summary (or the whole chat), with that summary as the saved state.
 * The scenario definition is deliberately left out, see remberPrompt.
 */
export function sceneSummaryPrompt(session: ChatSession, instructions: string): PromptMessage[] {
	const messages = session.contents.messages;
	const remberAt = messages.findLastIndex(m => m.rember);
	const scope = remberAt === -1 ? messages : messages.slice(remberAt);
	const state = remberAt === -1 ? null : messages[remberAt].rember;

	return [
		system(instructions),
		user(historyPayload(session, scope, state))
	];
}

/** Turns a scene summary into an image prompt */
export function sceneTagsPrompt(instructions: string, summary: string): PromptMessage[] {
	return [
		system(instructions),
		user(summary)
	];
}

/** Chat fragment as a markdown document, optionally preceded by a saved rEmber state */
function historyPayload(session: ChatSession, scope: ChatMessage[], state: string | null) {
	const names: Record<ChatMessage["from"], string> = {
		user: session.chat.userPersona.name,
		model: session.chat.scenario.name,
		system: ""
	};
	const history = scope
		.map(m => `## ${names[m.from]}:\n${selectedText(m)}\n\n`)
		.join("\n");

	return [
		...(state
			? ["# saved roleplay state", state, ""]
			: []
		),
		"# chat history",
		history
	].join("\n");
}

function system(content: string): PromptMessage {
	return { role: "system", content };
}
function user(content: string): PromptMessage {
	return { role: "user", content };
}

function toPrompt(message: ChatMessage): PromptMessage {
	return {
		role: message.from === "model" ? "assistant" : message.from,
		content: selectedText(message)
	};
}
