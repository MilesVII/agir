
const parser = new DOMParser();

class RampikeSVGImport extends HTMLElement {
	constructor() {
		super();
		const path = this.getAttribute("path");
		const attributes = this
			.getAttributeNames()
			.filter(a => a !== "path")
			.map(name => [name, this.getAttribute(name)] as [string, string]);

		if (!path) return;
		fetch(path).then(async response => {
			if (response.ok) {
				const raw = await response.text();
				const candidates = Array.from(parser.parseFromString(raw, "image/svg+xml").children);
				const parsed = candidates.find(c => c.tagName.toLowerCase() === "svg") as SVGElement;
				if (!parsed) return;

				for (const [a, v] of attributes) {
					parsed.setAttribute(a, v);
				}
				this.parentElement?.replaceChild(parsed, this);
			};
		});
	}
};

export function define(tagName: string) {
	window.customElements.define(tagName, RampikeSVGImport);
}
