import { upload } from "@root/persist";
import { ScenarioCard } from "@root/types";
import { nothrowAsync } from "@root/utils";
import { estimateTokenCount } from "tokenx";
import { CharacterBook, fromCharacterBook } from "./lorebook";

export type DatacatCard = {
	data: {
		name: string,
		tags: string[],
		avatar: string,
		creator: string,
		scenario: string,    // scenario
		first_mes: string,
		description: string, // char persona
		personality: string, // char persona if not fetched from janitor
		mes_example: string, // examples
		// personality: "", // skipped?
		// system_prompt: "",
		alternate_greetings: string[],
		creator_notes?: string,
		character_book?: CharacterBook
	},
	spec: "chara_card_v2",
	/** datacat's file exports have it; the Client API only promises `spec` and `data` */
	metadata?: {
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
		"# Instructions and scenario",
		"The user is {{user}}, all other roles are played by you"
	],
};

/** what the Client API knows besides the card: it has the picture behind a lease, and its own creator credit */
export type DatacatImportHints = {
	picture?: Blob | null,
	author?: { name: string, url: string | null },
	/** the public description, when the card has no description HTML */
	description?: string
};

export async function importDatacatJSON(parsed: DatacatCard, hints: DatacatImportHints = {}) {
	const metadata = parsed.metadata;
	const definitionSource = parsed.data.description
		? parsed.data.description.replace("##DESCRIPTION START##", "")
		: parsed.data.personality ?? "";
	const author = hints.author ?? (metadata?.janitor_creator_name
		? {
			name: metadata.janitor_creator_name,
			url: parsed.data.creator
		}
		: {
			name: parsed.data.creator,
			url: null
		});

	const definition = [
		...definitionTemplate.characters,
		fix(definitionSource.trim()),
		"",
		...definitionTemplate.userPersona,
		"",
		...definitionTemplate.instructions,
		fix(parsed.data.scenario ?? "")
	].join("\n").trim();

	const book = parsed.data.character_book?.entries?.length
		? await fromCharacterBook(parsed.data.character_book, parsed.data.name)
		: null;

	const converted: ScenarioCard = {
		id: crypto.randomUUID(),
		lastUpdate: Date.now(),
		lorebooks: book ? [book] : [],
		card: {
			author,
			description: metadata?.raw_description_html ?? hints.description ?? parsed.data.creator_notes ?? parsed.data.description,
			picture: hints.picture ? await upload(hints.picture) : await avatar(parsed.data.avatar),
			// tags as strings per Character Card V2, though datacat's own profiles send them as objects
			tags: (parsed.data.tags ?? []).map(t => typeof t === "string" ? t : (t as { name?: string })?.name ?? "").filter(t => t),
			title: metadata?.janitor_character_name ?? parsed.data.name
		},
		chat: {
			definition,
			initials: [
				parsed.data.first_mes,
				...(parsed.data.alternate_greetings ?? [])
			].filter(m => typeof m === "string").map(fix),
			name: metadata?.janitor_character_chatname ?? metadata?.janitor_character_name ?? parsed.data.name,
			picture: null,
			tokenCount: estimateTokenCount(definition)
		}
	}

	console.log(converted)

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
		.replace(/\{\{.*?\}\}/g,            v => v.toLowerCase())        // {{User}} -> {{user}}
		.replace(/^#+/gm,                   v => `##${v}`)               // header nesting
}
