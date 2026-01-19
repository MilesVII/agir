import { mudcrack } from "rampike";

class RampikeLabeled extends HTMLElement {
	constructor() {
		super();

		const legend = this.getAttribute("legend") ?? "";
		const multiline = this.getAttribute("multiline");
		const attributes = Object.fromEntries(
			this
				.getAttributeNames()
				.filter(a => a !== "legend" && a !== "multiline")
				.map(name => [name, this.getAttribute(name)] as [string, string])
		);
		if (!multiline) attributes.type = "text";

		const contents = mudcrack({
			tagName: "fieldset",
			contents: [
				mudcrack({
					tagName: "legend",
					attributes: {
						for: attributes.id,
					},
					contents: legend
				}),
				mudcrack({
					tagName: multiline ? "textarea" : "input",
					attributes
				})
			]
		});
		this.parentElement?.replaceChild(contents, this);
	}
};

export function define(tagName: string) {
	window.customElements.define(tagName, RampikeLabeled);
}

