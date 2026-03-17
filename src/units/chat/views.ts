import { ChatMessage } from "@root/types";
import { elementVisible, placeholder, renderMD, renderMDAsync } from "@root/utils";
import { toast } from "@units/toasts";
import { mudcrack, sirocco } from "rampike";

export function makeMessageView(
	msg: ChatMessage,
	[userPic, modelPic]: (string | null)[],
	isLast: boolean,
	onEdit: (swipeIx: number, value: string) => void,
	onReroll: () => void,
	onDelete: () => void,
	onSwipe: (six: number) => void
) {
	const status = mudcrack({
		tagName: "div",
		className: "message-status",
	});
	const text = msg.swipes[msg.selectedSwipe];
	const textBox = mudcrack({
		tagName: "div",
		className: "message-text edible md",
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
		onSwipe(msg.selectedSwipe);
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
		async () => {
			await navigator.clipboard.writeText(msg.swipes[msg.selectedSwipe]);
			toast("message copied to clipboard", { timeoutMS: 3200 });
		}
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

	const controlsTab = virtualTabs(
		["main", mainControls],
		["editing", [
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
		]],
		["streaming", []]
	);
	const controls = controlsTab.contents;
	const changeControlsState = controlsTab.pickTab;

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
	return sirocco(element, viewControls, "controls");
}
export type RampikeMessageView = ReturnType<typeof makeMessageView>;

export function remberMessageView(
	messageId: number,
	onEdit: (contents: string) => void,
	onRemove: () => void,
	contents: string = ""
) {
	const textBox = mudcrack({
		tagName: "div",
		className: "chat-rember-view edible",
		contents
	});
	let editPocket: string = "";

	const buttons = {
		edit: controlButton(
			"✎", "edit",
			() => {
				textBox.setAttribute("contenteditable", "");
				textBox.focus();
				editPocket = textBox.innerText;
				changeControlsState("edit");
			}
		),
		remove: controlButton(
			"✖", "remove",
			() => {
				if (!confirm(`the rEmber state for message #${messageId} will be removed`)) return;
				onRemove();
				suicide();
			}
		),
		editConfirm: controlButton(
			"✔", "save",
			async () => {
				textBox.removeAttribute("contenteditable");
				changeControlsState("main");
				onEdit(textBox.innerText);
			}
		),
		editCancel: controlButton(
			"✘", "cancel",
			async () => {
				textBox.removeAttribute("contenteditable");
				changeControlsState("main");
				textBox.innerHTML = editPocket;
			}
		)
	};
	const controlTabs = virtualTabs(
		["main", [
			buttons.edit,
			buttons.remove
		]],
		["edit", [
			buttons.editConfirm,
			buttons.editCancel
		]],
		["streaming", []]
	);
	const changeControlsState = controlTabs.pickTab;
	changeControlsState("main");

	const container = mudcrack({
		tagName: "div",
		className: "lineout list",
		contents: [
			mudcrack({
				tagName: "div",
				className: "row",
				contents: [
					mudcrack({
						tagName: "span",
						className: "hint",
						contents: `#${messageId}`
					}),
					mudcrack({
						tagName: "div",
						className: "row-compact float-end",
						contents: controlTabs.contents
					})
				]
			}),
			textBox
		],
		attributes: {
			title: String(messageId)
		}
	});

	function appendContent(value: string) {
		textBox.textContent += value;
	}
	function enable(value: string) {
		textBox.textContent = value;
		changeControlsState("main");
	}
	function suicide() {
		container.remove();
	}
	function hideControls() {
		changeControlsState("streaming");
	}

	return sirocco(
		container,
		{
			appendContent,
			enable,
			hideControls
		},
		"controls"
	);
}
export type RemberView = ReturnType<typeof remberMessageView>;

function controlButton(caption: string, hint: string, cb: () => void) {
	return mudcrack({
		tagName: "button",
		className: "strip ghost pointer message-control",
		contents: caption,
		attributes: { title: hint },
		events: { click: cb }
	});
}

type VirtualTabContents = string | Element[];
type Tab<K extends string = string> = readonly [K, VirtualTabContents];

function virtualTabs<const T extends readonly Tab[]>(...tabs: T) {
	type TabKeys = T[number][0];
	const ixes = new Map(tabs.map(([k], i) => [k, i]));
	const contents = tabs.map(([_, tab]) => 
		mudcrack({
			tagName: "div",
			className: "virtual",
			contents: tab
		})
	);

	function pickTab(state: TabKeys) {
		const tix = ixes.get(state);
		contents.forEach((tab, i) => tab.style.display = i === tix ? "contents" : "none");
	}

	return {
		contents,
		pickTab
	};
}
