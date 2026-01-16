export type RampikeUnit<T> = {
	init: (data: T) => void,
	update: (data: T) => void
}
