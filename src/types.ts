
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
export type ProviderMapWithActive = Record<string, Provider & { isActive: boolean, remberActive: boolean, proofreadActive: boolean }>;

export type ActiveProviders = {
	main:   string | null,
	rember: string | null,
	proofread?: string | null
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
	},
	/** copied into every chat started from the card */
	lorebooks?: Lorebook[]
};

/** How secondary keys refine a primary key match (SillyTavern's selective logic) */
export type LoreLogic = "andAny" | "notAll" | "notAny" | "andAll";
/** Where fired content lands: around the definition, or `depth` messages from the end of the chat */
export type LorePosition = "before" | "after" | "depth";
export type LorebookEntry = {
	id: number,
	name: string,
	keys: string[],
	secondaryKeys: string[],
	logic: LoreLogic,
	content: string,
	enabled: boolean,
	constant: boolean,
	order: number,
	position: LorePosition,
	depth: number,
	role: PromptRole,
	/** null: use the book's setting */
	caseSensitive: boolean | null,
	wholeWords: boolean | null,
	/** can't be fired by other entries' content */
	excludeRecursion: boolean,
	/** its content doesn't fire other entries */
	preventRecursion: boolean,
	scanDepth: number | null
};
export type Lorebook = {
	/** hash of keys and contents: same book, same id */
	id: string,
	name: string,
	enabled: boolean,
	scanDepth: number | null,
	tokenBudget: number | null,
	recursive: boolean,
	caseSensitive: boolean,
	wholeWords: boolean,
	entries: LorebookEntry[]
};
/** Per-chat lore activation settings */
export type LoreSettings = {
	/** story messages scanned for keys */
	scanDepth: number,
	tokenBudget: number
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
	lorebooks?: Lorebook[],
	lore?: LoreSettings
};

/**
 * Persisted chat record. `id` is unique within the chat and stable; it is not an index.
 * `from: "system"` marks an OOC note: an instruction to the model that is not part of the story.
 */
export type ChatMessage = {
	id: number,
	name: string,
	from: "user" | "model" | "system",
	swipes: string[],
	reasoningBoxes?: string[],
	selectedSwipe: number,
	rember: string | null
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
