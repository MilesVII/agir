import { mudcrack } from "rampike";

export function toast(message: string, actions: [caption: string, cb: () => void][] = []) {
	const list = document.querySelector("#toast-container")!;
	
	const rects = Array.from(list.children).map(t => t.getBoundingClientRect());
	const totalH = rects.reduce((p, c) => p + c.height, 0);

	const item = mudcrack({
		tagName: "div",
		className: "toast pointer",
		contents: message,
		style: {
			left: "var(--gap)",
			bottom: `calc(${totalH}px + var(--gap) * ${rects.length + 1})`,
			transform: "translateX(calc(-100% - var(--gap) * 2))"
		},
		events: {
			click: (_, el) => {
				const { width } = el.getBoundingClientRect();
				el.style.left = `calc(${-width}px - var(--gap))`;
				el.addEventListener("transitionend", () => {
					item.remove();
					squish();
				});
			}
		}
	});

	list.append(item);
	setTimeout(() => item.style.transform = `translateX(0px)`, 100);
}

function squish() {
	const list = document.querySelector<HTMLElement>("#toast-container")!;

	let totalH = 0;
	const items = Array.from(list.children) as HTMLElement[];
	items.forEach((item, ix) => {
		const { height } = item.getBoundingClientRect();
		item.style.bottom = `calc(${totalH}px + var(--gap) * ${ix + 1})`;
		totalH += height;
	});
}
