import { mudcrack } from "rampike";

/**
 * Fired on the `ram-modal` after it opens and after it closes, however it closed (button, Escape, backdrop click).
 * They bubble, so `document` hears every modal: the dialog's own events don't bubble, and nothing fires synchronously on `showModal()`.
 */
export const MODAL_OPEN = "ram-modal-open";
export const MODAL_CLOSE = "ram-modal-close";
/** inputs that Enter activates, as it should */
const BUTTON_INPUTS = new Set(["submit", "button", "reset", "image"]);

declare global {
	interface DocumentEventMap {
		[MODAL_OPEN]: Event & { target: RampikeModal },
		[MODAL_CLOSE]: Event & { target: RampikeModal }
	}
}

export class RampikeModal extends HTMLElement {
	dialog: HTMLDialogElement;
	/** the state last announced with MODAL_OPEN / MODAL_CLOSE */
	private announced = false;
	open() {
		if (this.dialog.open) return;
		this.dialog.showModal();
		this.announce();
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
			attributes: {
				method: "dialog"
			},
			events: {
				submit: e => e.preventDefault(),
				// Enter in a text field "clicks" the form's first button, which is usually "close":
				// fields that want Enter handle it with their own keydown listeners
				keydown: e => {
					const t = e.target;
					if (e.key === "Enter" && t instanceof HTMLInputElement && !BUTTON_INPUTS.has(t.type)) e.preventDefault();
				}
			}
		});
		this.dialog = mudcrack({
			tagName: "dialog",
			events: {
				click: (e, el) => {
					if (e.target === el && !this.hasAttribute("strong")) el.close();
				},
				// some Chromium builds fire only `toggle` and skip `close`, so either one announces
				close: () => this.announce(),
				toggle: () => this.announce()
			},
			contents: [ form ]
		});
		this.append(this.dialog);

		contents.forEach(e => form.appendChild(e));
	}

	private announce() {
		const open = this.dialog.open;
		if (open === this.announced) return;
		this.announced = open;
		this.dispatchEvent(new Event(open ? MODAL_OPEN : MODAL_CLOSE, { bubbles: true }));
	}
}

export function define(name: string) {
	window.customElements.define(name, RampikeModal);
}
