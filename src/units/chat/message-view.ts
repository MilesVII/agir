import { ChatMessage } from "@root/types";
import { elementVisible, placeholder, renderMD, renderMDAsync } from "@root/utils";
import { mudcrack, rampike } from "rampike";

export function makeMessageView(
	msg: ChatMessage,
	[userPic, modelPic]: (string | null)[],
	isLast: boolean,
	onEdit: (swipeIx: number, value: string) => void,
	onReroll: () => void,
	onDelete: () => void
) {
	function controlButton(caption: string, hint: string, cb: () => void) {
		return mudcrack({
			tagName: "button",
			className: "strip ghost pointer message-control",
			contents: caption,
			attributes: { title: hint },
			events: { click: cb }
		});
	}

	const status = mudcrack({
		tagName: "div",
		className: "message-status",
	});
	const text = msg.swipes[msg.selectedSwipe];
	const textBox = mudcrack({
		tagName: "div",
		className: "message-text",
		contents: text
	});
	const swipesCaption = mudcrack({
		tagName: "span",
		contents: ""
	});
	const swipesControl = mudcrack({
		tagName: "div",
		className: "row-compact no-shrink",
		contents: [
			controlButton(
				"<", "prev swipe",
				() => changeSwipe(-1)
			),
			swipesCaption,
			controlButton(
				">", "next swipe",
				() => changeSwipe(+1)
			)
		],
		style: {
			display: "none"
		}
	});
	async function changeSwipe(delta: number) {
		msg.selectedSwipe += delta;
		if (msg.selectedSwipe < 0) msg.selectedSwipe = msg.swipes.length - 1;
		if (msg.selectedSwipe >= msg.swipes.length) msg.selectedSwipe = 0;
		textBox.innerHTML = renderMD(msg.swipes[msg.selectedSwipe]);
		swipesCaption.textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
		swipesControl.style.display = (isLast && msg.swipes.length > 1) ? "flex" : "none";
	}
	async function setSwipeToLast() {
		msg.selectedSwipe = msg.swipes.length - 1;
		textBox.innerHTML = renderMD(msg.swipes[msg.selectedSwipe]);
		swipesCaption.textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
		swipesControl.style.display = (msg.swipes.length > 1) ? "flex" : "none";
	}
	function setStatus(value: string | null) {
		if (value === null) {
			status.hidden = true;
			return;
		}
		status.hidden = false;
		status.textContent = value;
	}

	function tab(contents: string | Element[]) {
		return mudcrack({
			tagName: "div",
			className: "virtual",
			contents
		});
	}
	const editButton = controlButton(
		"✎", "edit message",
		() => {
			textBox.setAttribute("contenteditable", "true");
			textBox.textContent = msg.swipes[msg.selectedSwipe];
			textBox.focus();
			changeControlsState("editing");
		}
	);
	const rerollButton = controlButton(
		"↺", "reroll this message",
		onReroll
	);
	const deleteButton = controlButton(
		"✖", "delete message along with following",
		onDelete
	);
	const copyButton = controlButton(
		"⧉", "copy message",
		() => navigator.clipboard.writeText(msg.swipes[msg.selectedSwipe])
	);

	function updateRerollButtonStatus() {
		if (msg.from === "model" && isLast)
			rerollButton.style.removeProperty("display");
		else
			rerollButton.style.display = "none";
	}
	const mainControls = [
		swipesControl,
		editButton,
		copyButton,
		rerollButton
	];
	if (msg.from === "user") mainControls.push(deleteButton);

	if (msg.from === "model" && isLast) {
		mainControls.push(
			
		);
	}
	const controls = [
		tab(mainControls),
		tab([
			controlButton(
				"✔", "save",
				async () => {
					const newContents = textBox.innerText;
					msg.swipes[msg.selectedSwipe] = newContents;
					textBox.removeAttribute("contenteditable");
					changeControlsState("main");
					onEdit(msg.selectedSwipe, newContents)
					// updateSwipe(meta.id, msg.id, msg.selectedSwipe, newContents);
					textBox.innerHTML = await renderMDAsync(newContents);
				}
			),
			controlButton(
				"✘", "cancel",
				async () => {
					textBox.removeAttribute("contenteditable");
					changeControlsState("main");
					textBox.innerHTML = await renderMDAsync(msg.swipes[msg.selectedSwipe]);
				}
			)
		]),
		tab([])
	];
	function changeControlsState(state: "main" | "editing" | "streaming") {
		const tix = {
			main: 0,
			editing: 1,
			streaming: 2
		}[state];
		controls.forEach((tab, i) => tab.style.display = i === tix ? "contents" : "none");
	}

	const element = mudcrack({
		tagName: "div",
		className: "message",
		attributes: {
			"data-mid": String(msg.id)
		},
		contents: [
			mudcrack({
				tagName: "img",
				attributes: {
					src: placeholder(msg.from === "user" ? userPic : modelPic)
				}
			}),
			mudcrack({
				contents: [
					mudcrack({
						className: "row",
						contents: [
							mudcrack({
								className: "message-name",
								contents: msg.name
							}),
							status,
							...controls
						]
					}),
					textBox
				]
			})
		]
	});
	changeSwipe(0);
	changeControlsState("main");
	updateRerollButtonStatus();
	setStatus(null);

	function updateMessage(value: ChatMessage) {
		msg = value;
	}
	function scrollIntoView() {
		if (elementVisible(element))
			element.scrollIntoView({ behavior: "smooth", block: "end"});
	}
	function startStreaming() {
		textBox.removeAttribute("contenteditable");
		textBox.innerHTML = "";
		changeControlsState("streaming");
		setStatus("responding...");

		return (value: string) => {
			textBox.innerText += value;
			if (elementVisible(element)) scrollIntoView();
		};
	}
	async function endStreaming() {
		await setSwipeToLast();
		changeControlsState("main");
		scrollIntoView();
		setStatus(null);
	}
	function setIsLast(value: boolean) {
		isLast = value;
		changeSwipe(0);
		updateRerollButtonStatus();
	}

	const viewControls = {
		updateSwipe: changeSwipe,
		changeControlsState,
		updateMessage,
		startStreaming,
		endStreaming,
		setIsLast
	};
	const wrapped = rampike(
		element,
		viewControls,
		() => {},
		{ skipInitialRender: true }
	);
	// function me() {
	// 	return wrapped;
	// }
	return wrapped;
}
export type RampikeMessageView = ReturnType<typeof makeMessageView>;
