
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
	picture: string | null
};

export type Engine = {
	name:  string,
	url:   string,
	key:   string,
	model: string,
	temp:    number,
	max:     number,
	context: number
};
export type EngineMap = Record<string, Engine>;

export type ScenarioCard = {
	id: string,
	card: {
		picture: string,
		title: string,
		description: string,
	},
	chat: {
		picture: string,
		name: string,
		definition: string
	}
}

export type Chat = {
	id: string,
	messages: ChatMessage[],
	userPersona: Persona,
	scenario: {
		id: string,
	} & ScenarioCard["chat"]
};
export type ChatMessage = {
	id: string,
	name: string,
	from: "user" | "model" | "system",
	swipes: string[],
	selectedSwipe: number,
	rember: string | null
};
