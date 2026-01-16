
const TAG_NAME = {
	button: "ram-tab-button",
	tab:    "ram-tab",
	tabs:   "ram-tabs"
};

class RampikeTab extends HTMLElement {
	get key() {
		return this.getAttribute("key") ?? "";
	}
	set key(value: string) {
		this.setAttribute("key", value)
	}

	constructor() {
		super();
		this.style.display = "contents";
	}
};

class RampikeTabContainer extends HTMLElement {
	static get observedAttributes() { return ["tab"]; }
	attributeChangedCallback(name: string, oldValue: string, value: string) {
		if (name !== "tab") return;
		if (oldValue === value) return;
		this.tab = value;
	}

	constructor() {
		super();
		this.style.display = "contents";
		this.update();
	}

	get tab() {
		return this.getAttribute("tab") ?? "";
	}
	set tab(value: string) {
		if (value === this.tab) return;
		this.setAttribute("tab", value);
		this.update();
	}

	private update() {
		const value = this.tab;
		this.querySelectorAll<RampikeTab>(TAG_NAME.tab).forEach(tab => {
			if (findParentTabContainer(tab)?.id !== this.id) return;

			const hidden = tab.key !== value;
			tab.hidden = hidden;
			tab.style.display = hidden ? "none" : "contents";
		});

		if (this.id) {
			const buttons = document.querySelectorAll<RampikeTabButton>(`${TAG_NAME.button}[for="${this.id}"]`);
			buttons.forEach(b => {
				b.active = b.tab === value;
			});
		}
	}
}

class RampikeTabButton extends HTMLElement {
	get tab() {
		return this.getAttribute("tab");
	}
	get targetContainer() {
		return this.getAttribute("for");
	}
	get active(): boolean {
		return this.getAttribute("tab-active") === "true";
	}
	set active(value: boolean) {
		if (value)
			this.setAttribute("tab-active", "true");
		else
			this.removeAttribute("tab-active");
	}
	constructor() {
		super();
		this.addEventListener("click", () => {
			const containerId = this.getAttribute("for");
			const tab = this.getAttribute("tab");
			if (!containerId || !tab) return;

			const container = document.querySelector<RampikeTabContainer>(`${TAG_NAME.tabs}#${containerId}`);
			if (!container) return;
			container.tab = tab;
		})
	}
}

export function define() {
	window.customElements.define(TAG_NAME.tab,    RampikeTab);
	window.customElements.define(TAG_NAME.tabs,   RampikeTabContainer);
	window.customElements.define(TAG_NAME.button, RampikeTabButton);
}
export type RampikeTabs = RampikeTabContainer;

function findParentTabContainer(origin: HTMLElement) {
	let target = origin.parentElement;
	while (target !== null && target.tagName !== TAG_NAME.tabs.toUpperCase()) {
		target = target.parentElement;
	}
	return target;
}
