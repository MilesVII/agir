
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
