import { mudcrack } from "rampike";

class RampikeFilePicker extends HTMLElement {
	get input() {
		return this.querySelector<HTMLInputElement>(`input[type="file"]`)!;
	}
	get value() {
		return this.input.value;
	}

	constructor() {
		super();

		const contents = mudcrack({
			tagName: "label",
			style: {
				display: "contents"
			},
			contents: [
				mudcrack({
					tagName: "input",
					attributes: {
						type: "file",
					},
					style: {
						display: "none"
					}
				}),
				...Array.from(this.children)
			]
		});
		this.append(contents);
	}
};

export function define(tagName: string) {
	window.customElements.define(tagName, RampikeFilePicker);
}

export type RampikePicker = RampikeFilePicker;
