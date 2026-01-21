import { getBlobLink, upload } from "@root/persist";
import { mudcrack } from "rampike";

const PLACHEOLDER = "assets/gfx/placeholder.png";

// value, placeholder, accept
class _RampikeImagePicker extends HTMLElement {
	get value(): File | string {
		return this.file ?? this.getAttribute("value") ?? "";
	}
	set value(v: string) {
		this.setAttribute("value", v);
		this.input.value = "";
		getBlobLink(v).then(src => {
			if (!src) return;
			this.image = src
		});
	}
	get input() {
		return this.querySelector<HTMLInputElement>(`input[type="file"]`)!;
	}
	get file() {
		return this.input.files?.[0];
	}
	set image(v: string) {
		const img = this.querySelector<HTMLImageElement>(`img`)!;
		this.revokeBlob?.();
		img.src = v;
		this.onDirty?.();
	}

	usePlaceholder() {
		this.image = this.getAttribute("placeholder") || PLACHEOLDER;
		this.input.value = "";
		this.setAttribute("value", "");
	}
	paste(file: File) {
		const container = new DataTransfer();
		container.items.add(file);
		this.input.files = container.files;
		this.setFile(file);
	}
	async valueHandle(): Promise<string | null> {
		return typeof this.value === "string"
			? this.value || null
			: (await upload(this.value));
	}
	onDirty: (() => void) | null = null;

	private revokeBlob: (() => void) | null = null;
	private setFile(file: File) {
		const link = URL.createObjectURL(file);
		this.image = link;
		this.revokeBlob = () => {
			URL.revokeObjectURL(link);
			this.revokeBlob = null;
		}
		this.setAttribute("value", "");
		this.onDirty?.();
	}

	constructor() {
		super();

		const image = mudcrack({
			tagName: "img",
			attributes: {
				src: this.getAttribute("placeholder") || PLACHEOLDER
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
					if (!file?.type.startsWith("image/")) return;

					this.setFile(file);
				}
			}
		});

		const contents = mudcrack({
			tagName: "label",
			style: {
				display: "contents"
			},
			contents: [ input, image ]
		});
		this.append(contents);
	}
};

export function define(tagName: string) {
	window.customElements.define(tagName, _RampikeImagePicker);
}

export type RampikeImagePicker = _RampikeImagePicker;
