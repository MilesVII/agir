
export type Result<T, E> = {
	success: true,
	value: T
} | {
	success: false,
	error: E
};

export type Folder = string | null;
export type Persona = {
	id: string,
	name: string,
	description: string,
	pronouns: Pronouns,
	picture: string | null,
	lastUpdate: number
};
export type Pronouns = {
	subjective: string,
	objective: string,
	possessiveAdj: string,
	possessivePro: string,
	reflexive: string
};

export type MediaEntry = {
	id: string,
	media: Blob,
	mime: string
};

export type Provider = {
	name:  string,
	url:   string,
	key:   string,
	model: string,
	temp:   number,
	max:    number,
	params: Record<string, any>,
	suffix: string,
	reasoning: string
};
export type ProviderMap = Record<string, Provider>;
export type ProviderMapWithActive = Record<string, Provider & { isActive: boolean, remberActive: boolean }>;

export type ActiveProviders = {
	main:   string | null,
	rember: string | null,
	illustrate?: string | null
};

export type ScenarioCard = {
	id: string,
	lastUpdate: number,
	card: {
		picture: string | null,
		title: string,
		description: string,
		author: {
			name: string,
			url: string | null
		} | null,
		tags: string[]
	},
	chat: {
		picture: string | null,
		name: string,
		definition: string,
		initials: string[],
		tokenCount: number
	}
};

export type Chat = {
	id: string,
	userPersona: Persona,
	scenario: {
		id: string,
	} & ScenarioCard["chat"],
	lastUpdate: number,
	messageCount: number,
	messageChunks: string[],
	rember: RemberSettings,
	folder: Folder,
	memo?: string,
	illustrate?: IllustrateSettings
};

/** Persisted chat record. `id` always equals the message's index in `ChatContents.messages`. */
export type ChatMessage = {
	id: number,
	name: string,
	from: "user" | "model" | "system",
	swipes: string[],
	reasoningBoxes?: string[],
	selectedSwipe: number,
	rember: string | null,
	illustration?: Illustration
};

/** A rendered scene attached to a message; `media` is an idb media id */
export type Illustration = {
	media: string,
	/** the image prompt the picture was rendered from */
	prompt: string,
	/** the scene summary the prompt was derived from */
	summary: string
};

export type IllustrateSettings = {
	summaryPrompt: string,
	tagsPrompt: string
};

/** What actually goes to the completion API. Built from ChatMessages by units/chat/prompt.ts */
export type PromptRole = "system" | "user" | "assistant";
export type PromptMessage = {
	role: PromptRole,
	content: string
};

export type RemberSettings = {
	stride: number,
	prompt: string
};

export type ChatContents = {
	id: string,
	messages: ChatMessage[],
};
