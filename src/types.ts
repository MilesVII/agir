
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