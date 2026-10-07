import { mudcrack } from "rampike";

/*
Helpers shared by views built from raw .html templates. Templates are parsed once with
rampike's htmlTemplate() and cloned with sprout(), which also collects the [data-ref] elements.
- tabGroups(): show one [data-tab] group at a time
- emit(): bubble a typed CustomEvent up to whoever controls the view
- setPicture(): fill an <img> from a value that may still be loading

Long-lived views that several modules talk to (chat message, rEmber entry) emit events.
Plain list items take a handlers object from the unit that renders them.
*/

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

export function setPicture(image: HTMLImageElement, source: PictureSource) {
	if (typeof source === "string") image.src = source;
	else if (source) source.then(src => { if (src) image.src = src; });
}

export function placeholderView(text: string) {
	return mudcrack({ className: "placeholder", contents: text });
}
