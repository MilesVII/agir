import { upload } from "@root/persist";
import { ScenarioCard } from "@root/types";
import { nothrowAsync } from "@root/utils";
import { estimateTokenCount } from "tokenx";

export type DatacatCard = {
	data: {
		name: string,
		tags: string[],
		avatar: string,
		creator: string,
		scenario: string,    // scenario
		first_mes: string,
		description: string, // char persona
		mes_example: string, // examples
		// personality: "", // skipped?
		// system_prompt: "",
		alternate_greetings: string[]
	},
	spec: "chara_card_v2",
	metadata: {
		created: number,
		modified: number,
		janitor_creator_name: string,
		raw_description_html: string,
		janitor_character_name: string,
		janitor_character_chatname: string
	}
};

// ref: src/units/scenario.ts
const definitionTemplate = {
	characters: [
		"# Characters",
		"## {{char}} "
	],
	userPersona: [
		"## {{user}}",
		"{{persona}}"
	],
	instructions: [
		"# Instructions",
		"The user is {{user}}, all other roles are played by you"
	],
};

export async function importDatacatJSON(parsed: DatacatCard) {
	const definition = [
		...definitionTemplate.characters,
		fix(parsed.data.description.replace("##DESCRIPTION START##", "").trim()),
		"",
		...definitionTemplate.userPersona,
		"",
		...definitionTemplate.instructions,
		fix(parsed.data.scenario ?? "")
	].join("\n").trim();

	const converted: ScenarioCard = {
		id: crypto.randomUUID(),
		lastUpdate: Date.now(),
		card: {
			author: {
				name: parsed.metadata.janitor_creator_name,
				url: parsed.data.creator
			},
			description: parsed.metadata.raw_description_html,
			picture: await avatar(parsed.data.avatar),
			tags: parsed.data.tags,
			title: parsed.metadata.janitor_character_name
		},
		chat: {
			definition,
			initials: [
				parsed.data.first_mes,
				...(parsed.data.alternate_greetings ?? [])
			].map(fix),
			name: parsed.metadata.janitor_character_chatname ?? parsed.metadata.janitor_character_name,
			picture: null,
			tokenCount: estimateTokenCount(definition)
		}
	}

	return converted;
}

async function avatar(url?: string) {
	if (!url) return null;

	const response = await nothrowAsync(fetch(url));
	if (!response.success) return null;

	const blob = await nothrowAsync(response.value.blob());
	if (!blob.success) return null;

	return upload(blob.value);
}
function fix(raw: string) {
	return raw
		.replace(/(?<!\{)\{[^}]*\}(?!\})/g, v => `{${v.toLowerCase()}}`) // {User} -> {{user}}
		.replace(/^#+/gm,                   v => `##${v}`) // header nesting
}
