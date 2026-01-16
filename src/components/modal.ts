import { mudcrack } from "rampike";

export class RampikeModal extends HTMLElement {
	dialog: HTMLDialogElement;
	open() {
		if (this.dialog.open) return;
		this.dialog.showModal();
	}
	close() {
		if (!this.dialog.open) return;
		this.dialog.close();
	}

	constructor() {
		super();

		this.style.display = "contents";

		const contents = Array.from(this.childNodes);

		const form = mudcrack({
			tagName: "form",
			className: "shadow",
			attributes: {
				method: "dialog"
			},
			events: {
				submit: e => e.preventDefault()
			}
		});
		this.dialog = mudcrack({
			tagName: "dialog",
			events: {
				click: (e, el) => {
					if (e.target === el) el.close();
				}
			},
			contents: [ form ]
		});
		this.append(this.dialog);

		contents.forEach(e => form.appendChild(e));
	}
}

export function define(name: string) {
	window.customElements.define(name, RampikeModal);
}
