
type UnitInputs = undefined;
export type RampikeUnit = {
	init?: (inputs: UnitInputs) => void,
	update?: (inputs: UnitInputs) => void
}
