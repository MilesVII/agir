import { getBlobLink } from "@root/persist";
import { nothrowAsync, placeholder } from "@root/utils";
import { toast } from "@units/toasts";
import { mudcrack } from "rampike";

// value, placeholder, accept
// emits "pick" once a picked or pasted picture is read and shown
class _RampikeImagePicker extends HTMLElement {
	/** A freshly picked picture as an in-memory blob, or the media id or URL of a stored one, or "" */
	get value(): Blob | string {
		return this.picked ?? this.getAttribute("value") ?? "";
	}
	set value(v: string) {
		this.picked = null;
		this.setAttribute("value", v);
		this.input.value = "";
		if (v) {
			getBlobLink(v).then(src => {
				if (!src) return;
				this.image = src
			});
		}
	}
	get input() {
		return this.querySelector<HTMLInputElement>(`input[type="file"]`)!;
	}
	set image(v: string) {
		const img = this.querySelector<HTMLImageElement>(`img`)!;
		this.revokeBlob?.();
		img.src = v;
		this.onDirty?.();
		setTimeout(() => {
			this.clearButton.hidden = !this.value
		}, 0)
	}

	usePlaceholder() {
		this.picked = null;
		this.image = placeholder(this.getAttribute("placeholder"));
		this.input.value = "";
		this.setAttribute("value", "");
	}
	paste(file: File) {
		this.setFile(file);
	}
	onDirty: (() => void) | null = null;

	/**
	 * Picked files are copied into memory right away: a File from an <input> is only a handle,
	 * and picker apps on Android drop their temporary copy soon after, which makes the handle
	 * unreadable by the time the form is saved.
	 */
	private picked: Blob | null = null;
	private revokeBlob: (() => void) | null = null;
	private async setFile(file: File) {
		const bytes = await nothrowAsync(file.arrayBuffer());
		this.input.value = "";
		if (!bytes.success) {
			toast("can't read the picture, try picking it again");
			return;
		}
		this.picked = new Blob([bytes.value], { type: file.type });
		this.setAttribute("value", "");

		const link = URL.createObjectURL(this.picked);
		this.image = link;
		this.revokeBlob = () => {
			URL.revokeObjectURL(link);
			this.revokeBlob = null;
		}
		this.dispatchEvent(new Event("pick"));
	}
	private async pasteFromClipboard() {
		// the clipboard is read only on a click; browsers may still refuse or offer no image at all
		if (!navigator.clipboard?.read) {
			toast("this browser doesn't let pages read pictures from the clipboard");
			return;
		}
		const contents = await nothrowAsync(navigator.clipboard.read());
		if (!contents.success) {
			toast(`can't read the clipboard: ${contents.error?.message ?? contents.error}`);
			return;
		}
		for (const item of contents.value) {
			const type = item.types.find(t => t.startsWith("image/"));
			if (!type) continue;

			const blob = await nothrowAsync(item.getType(type));
			if (!blob.success) {
				toast("can't read the picture from the clipboard");
				return;
			}
			this.paste(new File([blob.value], "pasted", { type }));
			return;
		}
		const offered = Array.from(new Set(contents.value.flatMap(i => i.types)));
		toast(offered.length > 0
			? `no picture in the clipboard, only ${offered.join(", ")}`
			: "the clipboard is empty or the browser doesn't share it");
	}
	private clearButton: HTMLButtonElement;

	constructor() {
		super();

		const image = mudcrack({
			tagName: "img",
			attributes: {
				src: placeholder(this.getAttribute("placeholder"))
			}
		});
		const preview = this.getAttribute("value");
		if (preview) getBlobLink(preview).then(src => {
			if (!src) return;
			image.src = src;
		})
		const input = mudcrack({
			tagName: "input",
			attributes: {
				type: "file",
				accept: this.getAttribute("accept") ?? "",
			},
			style: {
				display: "none"
			},
			events: {
				input: (_ev, el) => {
					const file = el.files?.[0];
					if (!file) return;
					// some pickers hand over files without a type; let those through
					if (file.type && !file.type.startsWith("image/")) {
						el.value = "";
						return;
					}

					this.setFile(file);
				}
			}
		});

		this.clearButton = mudcrack({
			tagName: "button",
			className: "lineout image-picker-clear pointer",
			contents: "clear",
			attributes: {
				hidden: "true"
			},
			events: {
				click: () => this.usePlaceholder()
			}
		});
		const pasteButton = mudcrack({
			tagName: "button",
			className: "lineout image-picker-paste pointer",
			contents: "⎘",
			events: {
				click: () => this.pasteFromClipboard()
			}
		});
		const contents = [
			mudcrack({
				tagName: "label",
				style: {
					display: "contents"
				},
				contents: [ input, image ]
			}),
			this.clearButton,
			pasteButton
		];
		this.style.position = "relative";
		this.append(...contents);
	}
};

export function define(tagName: string) {
	window.customElements.define(tagName, _RampikeImagePicker);
}

export type RampikeImagePicker = _RampikeImagePicker;
