import { fromTemplateFirst, mudcrack } from "rampike";

/*
Helpers for views built from raw .html templates:
- instantiate(): clone the template's first element
- pickRefs(): collect [data-ref] elements into a typed record
- tabGroups(): show one [data-tab] group at a time
- emit(): bubble a typed CustomEvent up to whoever controls the view
- setPicture(): fill an <img> from a value that may still be loading

Long-lived views that several modules talk to (chat message, rEmber entry) emit events.
Plain list items take a handlers object from the unit that renders them.
*/

const templates = new Map<string, HTMLTemplateElement>();

export function instantiate<T extends Element = HTMLElement>(html: string): T {
	let template = templates.get(html);
	if (!template) {
		template = document.createElement("template");
		template.innerHTML = html;
		templates.set(html, template);
	}
	const element = fromTemplateFirst<T>(template);
	if (!element) throw new Error("view template has no root element");
	return element;
}

export function pickRefs<const K extends readonly string[]>(root: Element, keys: K) {
	const refs = {} as Record<K[number], HTMLElement>;
	for (const key of keys) {
		const element = root.querySelector<HTMLElement>(`[data-ref="${key}"]`);
		if (!element) throw new Error(`view template is missing [data-ref="${key}"]`);
		refs[key as K[number]] = element;
	}
	return refs;
}

export function tabGroups(root: Element) {
	const groups = Array.from(root.querySelectorAll<HTMLElement>("[data-tab]"));
	return {
		pick(name: string) {
			groups.forEach(g => g.hidden = g.dataset.tab !== name);
		}
	};
}

type EventDetail<K extends keyof HTMLElementEventMap> =
	HTMLElementEventMap[K] extends CustomEvent<infer D> ? D : never;

export function emit<K extends keyof HTMLElementEventMap>(target: Element, name: K, detail: EventDetail<K>) {
	target.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}

/** A resolved blob link, a pending one, or nothing: the placeholder stays until a link arrives */
export type PictureSource = string | Promise<string | null> | null;

export function setPicture(img: HTMLElement, source: PictureSource) {
	const image = img as HTMLImageElement;
	if (typeof source === "string") image.src = source;
	else if (source) source.then(src => { if (src) image.src = src; });
}

export function placeholderView(text: string) {
	return mudcrack({ className: "placeholder", contents: text });
}
