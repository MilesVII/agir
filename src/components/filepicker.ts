import { mudcrack } from "rampike";

class RampikeFilePicker extends HTMLElement {

	get value() {
		const input = this.querySelector<HTMLInputElement>(`input[type="file"]`)!;
		return input.value;
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
