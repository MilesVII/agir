import { upload } from "@root/persist";
import { ScenarioCard } from "@root/types";
import { toast } from "@units/toasts";
import { estimateTokenCount } from "tokenx";

const parser = new DOMParser();

// ref: src/units/scenario.ts
const definitionTemplate = {
	characters: [
		"# Characters",
		"## {{char}} "
	].join("\n"),
	userPersona: [
		"## {{user}}",
		"{{persona}}"
	].join("\n"),
	instructions: [
		"# Instructions",
		"You play as {{char}}, the user is {{user}}"
	].join("\n"),
}

export async function downloadScenarioCard(url: string): Promise<ScenarioCard | null>  {
	url = url.toLowerCase().replace("janitorai.com/", "jannyai.com/");
	const response = await fetch(`https://fenrir.milesseventh.workers.dev/steel/${encodeURIComponent(url)}`);
	if (!response.ok) {
		toast("network error");
		return null;
	}

	const raw = await response.text();
	const dom = parser.parseFromString(raw, "text/html");
	const pivot = dom.querySelector("h1");
	if (!pivot) {
		toast("can't find title in downloaded page");
		return null;
	}
	const [title, description, tagsContainer] = Array.from(pivot!.parentElement!.children) as HTMLElement[];
	const tags = Array.from(tagsContainer.querySelectorAll("li")).map(e => e.innerText);

	let personality = "";
	let scenario = "";
	let firstMessage = "";
	const definitionContainer = dom.querySelector("details ul");
	definitionContainer!.querySelectorAll("li").forEach(e => {
		const caption = e.querySelector("span")!;
		const captionText = caption.innerText.toLocaleLowerCase().trim();
		caption.remove();

		if (captionText.includes("personality")) personality  = fix(e.innerText.trim());
		if (captionText.includes("scenario"))    scenario     = fix(e.innerText.trim());
		if (captionText.includes("first"))       firstMessage = fix(e.innerText.trim());
	});
	function fix(raw: string) {
		return raw
			.replace(/(?<!\{)\{[^}]*\}(?!\})/g, v => `{${v}}`) // {user} -> {{user}}
			.replace(/^#+/gm,                   v => `##${v}`) // header nesting
	}

	let definition = `${definitionTemplate.characters}\n${personality}\n\n${definitionTemplate.userPersona}\n\n`;
	if (scenario) definition = definition.concat(`# Scenario\n${scenario}\n\n`);
	definition = definition.concat(`${definitionTemplate.instructions}`);

	const authorName =
		Array.from(dom.querySelectorAll("a"))
		.find(e => e.innerText.trim().startsWith("@"))
		?.innerText.trim().slice(1);

	let picture: string | null = null;
	const pictureContainer = dom.querySelector<HTMLImageElement>("img.w-full");
	if (pictureContainer) {
		const response = await fetch(pictureContainer!.src);
		if (response.ok) {
			const blob = await response.blob();
			picture = await upload(blob);
		}
	}

	console.log(description)
	return {
		card: {
			author: {
				name: authorName || "unknown",
				url
			},
			title: title!.innerText,
			description: description!.innerHTML,
			tags,
			picture
		},
		chat: {
			definition,
			initials: [firstMessage],
			name: "",
			picture: null,
			tokenCount: estimateTokenCount(definition)
		},
		id: crypto.randomUUID(),
		lastUpdate: Date.now()
	};
}
