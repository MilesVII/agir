import { mudcrack } from "rampike";
import { RampikeModal } from "./modal";

type ButtonControl = [string, null | (() => void)];

export function popup(message: (container: HTMLElement) => void, buttons: ButtonControl[]): void;
export function popup(message: string,                           buttons: ButtonControl[]): void;

export function popup(
	message: string | ((container: HTMLElement) => void),
	buttons: ButtonControl[]
) {
	const popup = document.querySelector<RampikeModal>("#popup")!;
	const container = document.querySelector<HTMLElement>("#popup-message")!;
	const controls  = document.querySelector<HTMLElement>("#popup-buttons")!;

	if (typeof message === "string")
		container.textContent = message;
	else
		message(container);

	controls.innerHTML = "";
	controls.append(
		...buttons.map(([contents, cb]) =>
			mudcrack({
				tagName: "button",
				className: "strip-defaults button",
				contents,
				events: {
					click: () => cb ? cb() : popup.close()
				}
			})
		)
	);

	popup.open();
}
