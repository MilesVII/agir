import { mudcrack } from "rampike";

type ToastOptions = {
	timeoutMS?: number,
	actions?: [caption: string, cb: (close: () => void) => void][]
};

export function toast(message: string, options?: ToastOptions) {
	const list = document.querySelector("#toast-container")!;
	
	const rects = Array.from(list.children).map(t => t.getBoundingClientRect());
	const totalH = rects.reduce((p, c) => p + c.height, 0);
	let closed = false;

	const actions = options?.actions
		? options.actions.map(([caption, cb]) => 
			mudcrack({
				tagName: "button",
				className: "lineout",
				contents: caption,
				events: {
					click: () => !closed && cb(close)
				}
			})
		)
		: [];

	const item = mudcrack({
		tagName: "div",
		className: "toast list pointer",
		contents: [
			mudcrack({
				tagName: "div",
				contents: message
			}),
			mudcrack({
				tagName: "div",
				className: "row-compact jc-end",
				style: actions.length
					? {}
					: { display: "none" },
				contents: actions
			})
		],
		style: {
			left: "var(--gap)",
			bottom: `calc(${totalH}px + var(--gap) * ${rects.length + 1})`,
			transform: "translateX(calc(-100% - var(--gap) * 2))"
		},
		events: {
			click: () => !options?.actions && close()
		}
	});

	function close() {
		if (closed) return;
		closed = true;

		const { width } = item.getBoundingClientRect();
		item.style.left = `calc(${-width}px - var(--gap))`;
		item.addEventListener("transitionend", () => {
			item.remove();
			squish();
		});
	}

	list.append(item);
	setTimeout(() => item.style.transform = `translateX(0px)`, 100);

	if (options?.timeoutMS) {
		setTimeout(close, options.timeoutMS);
	}

	return close;
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
