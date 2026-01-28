
export type Result<T, E> = {
	success: true,
	value: T
} | {
	success: false,
	error: E
};

export type Persona = {
	id: string,
	name: string,
	description: string,
	pronouns: Pronouns,
	picture: string | null
	lastUpdate: number
};
export type Pronouns = {
	subjective: string,
	objective: string,
	possessiveAdj: string,
	possessivePro: string,
	reflexive: string
};

export type Engine = {
	name:  string,
	url:   string,
	key:   string,
	model: string,
	temp:    number,
	max:     number,
	params: Record<string, any>
};
export type EngineMap = Record<string, Engine>;
export type EngineMapWithActive = Record<string, Engine & { isActive: boolean }>;

export type ActiveEngines = {
	main:   string | null,
	rember: string | null
};

export type ScenarioCard = {
	id: string,
	lastUpdate: number,
	card: {
		picture: string | null,
		title: string,
		description: string,
		tags: string[]
	},
	chat: {
		picture: string | null,
		name: string,
		definition: string,
		initials: string[]
	}
}

export type Chat = {
	id: string,
	userPersona: Persona,
	scenario: {
		id: string,
	} & ScenarioCard["chat"],
	lastUpdate: number,
	messageCount: number
};
export type ChatMessage = {
	id: number,
	name: string,
	from: "user" | "model" | "system",
	swipes: string[],
	selectedSwipe: number,
	rember: string | null
};
export type ChatContents = {
	id: string,
	messages: ChatMessage[],
};
