import { mudcrack } from "rampike";

class _RampikeFilePicker extends HTMLElement {
	get input() {
		return this.querySelector<HTMLInputElement>(`input[type="file"]`)!;
	}
	get value() {
		return this.input.value;
	}

	constructor() {
		super();

		const input = mudcrack({
			tagName: "input",
			attributes: {
				type: "file",
				accept: this.getAttribute("accept") ?? "",
			},
			style: {
				display: "none"
			}
		});

		const contents = mudcrack({
			tagName: "label",
			style: {
				display: "contents"
			},
			contents: [
				input,
				...Array.from(this.children)
			]
		});

		if (this.hasAttribute("multiple"))
			input.setAttribute("multiple", "");
		this.append(contents);
	}
};

export function define(tagName: string) {
	window.customElements.define(tagName, _RampikeFilePicker);
}

export type RampikeFilePicker = _RampikeFilePicker;
