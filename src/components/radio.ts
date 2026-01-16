
const TAG_NAME = {
	radio:  "ram-radio",
	option: "ram-radio-option",
	slider: "ram-radio-slider"
};

export class RampikeRadio extends HTMLElement {
	get value() {
		return this.getAttribute("value") ?? "";
	}
	set value(v: string) {
		this.select(v);
	}

	private options: RampikeRadioOption[] = [];
	private slider: RampikeRadioSlider | null = null;
	private select(v: string = this.value) {
		const oldValue = this.value;
		if (oldValue !== v) {
			this.setAttribute("value", v);
			this.dispatchEvent(new CustomEvent("r-change", {
				detail: {
					oldValue,
					newValue: v
				}
			}));
		}
		this.options.forEach(item => item.selected = this.value === item.key);
		const selected: RampikeRadioOption | null = this.options.find(item => this.value === item.key) ?? null;
		if (selected) {
			this.slider?.connect(selected);
		}
	}

	update() {
		const options = Array.from(this.querySelectorAll<RampikeRadioOption>(TAG_NAME.option));
		const groupFilter = (o: HTMLElement) =>
				torpedo(
					o,
					t => t.tagName === TAG_NAME.radio.toUpperCase()
				) === this;
		this.options = options.filter(groupFilter);

		const slider = this.querySelector<RampikeRadioSlider>(TAG_NAME.slider);
		this.slider = (slider && groupFilter(slider)) ? slider : null;

		this.style.setProperty("--option-count", `${this.options.length}`);
	}

	constructor() {
		super();
		this.style.position = "relative";
		setTimeout(() => {
			this.update();
			this.select();
		}, 0);
	}
};

class RampikeRadioOption extends HTMLElement {
	get selected() {
		return this.getAttribute("selected") === "true";
	}
	set selected(v: boolean) {
		if (v)
			this.setAttribute("selected", "true");
		else
			this.removeAttribute("selected");
	}

	get key() {
		return this.getAttribute("key") ?? "";
	}
	set key(v: string) {
		this.setAttribute("key", v);
	}

	constructor() {
		super();
		this.style.position = "relative";
		const seeker = (candidate: HTMLElement) => candidate.tagName === TAG_NAME.radio.toUpperCase();
		const parent = torpedo<RampikeRadio>(this, seeker);
		if (!parent) return;
		this.addEventListener("click", () => parent.value = this.key);
	}
};

class RampikeRadioSlider extends HTMLElement {
	private target?: RampikeRadioOption;

	connect(target: RampikeRadioOption) {
		this.target = target;
		const container = torpedo(this, t => t.tagName === TAG_NAME.radio.toUpperCase())!;

		const containerBox = container.getBoundingClientRect();
		const targetBox = target.getBoundingClientRect();
		this.style.left = `${targetBox.left - containerBox.left}px`;
		this.style.right = `${containerBox.right - targetBox.right}px`;
	}

	constructor() {
		super();
		this.style.position = "absolute";
		this.style.top = "0";
		this.style.bottom = "0";

		const observer = new IntersectionObserver(() => this.target && this.connect(this.target));
		observer.observe(this);
	}
};

export function define() {
	window.customElements.define(TAG_NAME.radio,  RampikeRadio);
	window.customElements.define(TAG_NAME.option, RampikeRadioOption);
	window.customElements.define(TAG_NAME.slider, RampikeRadioSlider);
}

function torpedo<T extends HTMLElement>(
	origin: Element,
	seeker: (target: HTMLElement) => boolean
): T | null {
	while(true) {
		const parent = origin.parentElement;
		if (!parent) return null;
		if (seeker(parent)) return parent as T;
		origin = parent;
	}
}
