import { getBlobLink, idb } from "@root/persist";
import { Chat, ChatMessage } from "@root/types";
import { placeholder, renderMDAsync } from "@root/utils";
import { mudcrack, rampike } from "rampike";
import { gainResponse, preparePayload } from "./send";

export async function updateSwipe(chatId: string, messageId: number, swipeIx: number, value: string) {
	const contents = await idb.get("chatContents", chatId);
	if (!contents.success) return;

	const tix = contents.value.messages.findIndex(m => m.id === messageId);
	if (tix < 0) return;

	contents.value.messages[tix].swipes[swipeIx] = value;
	await idb.set("chatContents", contents.value);
}
export async function updateSwipes(chatId: string, messageId: number, value: string[], swipeIx = 0) {
	const contents = await idb.get("chatContents", chatId);
	if (!contents.success) return;

	const tix = contents.value.messages.findIndex(m => m.id === messageId);
	if (tix < 0) return;

	contents.value.messages[tix].swipes = value;
	contents.value.messages[tix].selectedSwipe = swipeIx;
	await idb.set("chatContents", contents.value);
}

export async function pushSwipe(chatId: string, value: string, fromUser: boolean, name: string) {
	const contents = await idb.get("chatContents", chatId);
	if (!contents.success) return null;
	const messages = contents.value.messages;

	let updatedMessage: ChatMessage;
	let makeNew: boolean;
	const lix = messages.findLastIndex(() => true);
	if (!fromUser && (lix > -1) && messages[lix].from === "model") {
		contents.value.messages[lix].selectedSwipe = contents.value.messages[lix].swipes.length;
		contents.value.messages[lix].swipes.push(value);
		updatedMessage = contents.value.messages[lix];
		makeNew = false;
	} else {
		updatedMessage = {
			from: fromUser ? "user" : "model",
			id: contents.value.messages.length,
			name: name,
			rember: null,
			selectedSwipe: 0,
			swipes: [value]
		};
		contents.value.messages.push(updatedMessage);
		makeNew = true;
	}

	await idb.set("chatContents", contents.value);

	return { updatedMessage, makeNew };
}

export function makeMessageView(_msg: ChatMessage, meta: Chat, [userPic, modelPic]: (string | null)[], isLast: boolean) {
	let msg = _msg;
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
		className: "row-compact",
		contents: [
			mudcrack({
				tagName: "button",
				className: "strip pointer",
				contents: "<",
				events: {
					click: () => changeSwipe(-1)
				}
			}),
			swipesCaption,
			mudcrack({
				tagName: "button",
				className: "strip pointer",
				contents: ">",
				events: {
					click: () => changeSwipe(-1)
				}
			})
		],
		style: {
			visibility: "hidden"
		}
	});
	async function changeSwipe(delta: number) {
		msg.selectedSwipe += delta;
		if (msg.selectedSwipe < 0) msg.selectedSwipe = msg.swipes.length - 1;
		if (msg.selectedSwipe >= msg.swipes.length) msg.selectedSwipe = 0;
		textBox.innerHTML = await renderMDAsync(msg.swipes[msg.selectedSwipe]);
		swipesCaption.textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
		swipesControl.style.display = (!isLast && msg.swipes.length > 1) ? "contents" : "none";
	}
	async function setSwipeToLast() {
		msg.selectedSwipe = msg.swipes.length - 1;
		textBox.innerHTML = await renderMDAsync(msg.swipes[msg.selectedSwipe]);
		swipesCaption.textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
		swipesControl.style.display = (msg.swipes.length > 1) ? "contents" : "none";
	}

	function tab(contents: string | Element[]) {
		return mudcrack({
			tagName: "div",
			className: "virtual",
			contents
		});
	}
	const controls = [
		tab([
			swipesControl,
			mudcrack({
				tagName: "button",
				className: "strip pointer",
				contents: "edit",
				events: {
					click: () => {
						textBox.setAttribute("contenteditable", "true");
						textBox.textContent = msg.swipes[msg.selectedSwipe];
						textBox.focus();
						changeControlsState("editing");
					}
				}
			}),
			(msg.from === "model" && isLast)
				? mudcrack({
					tagName: "button",
					className: "strip pointer",
					contents: "reroll",
					events: {
						click: () => {
							alert("TODO");
							// preparePayload()
							// gainResponse()
						}
					}
				})
				: null
		].filter(e => e) as Element[]),
		tab([
			mudcrack({
				tagName: "button",
				className: "strip pointer",
				contents: "confirm",
				events: {
					click: async () => {
						const newContents = textBox.innerText;
						console.log(newContents);
						msg.swipes[msg.selectedSwipe] = newContents;
						textBox.removeAttribute("contenteditable");
						changeControlsState("main");
						updateSwipe(meta.id, msg.id, msg.selectedSwipe, newContents);
						textBox.innerHTML = await renderMDAsync(newContents);
					}
				}
			}),
			mudcrack({
				tagName: "button",
				className: "strip pointer",
				contents: "cancel",
				events: {
					click: async () => {
						textBox.removeAttribute("contenteditable");
						changeControlsState("main");
						textBox.innerHTML = await renderMDAsync(msg.swipes[msg.selectedSwipe]);
					}
				}
			})
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

	function updateMessage(value: ChatMessage) {
		msg = value;
	}
	function startStreaming() {
		textBox.removeAttribute("contenteditable");
		textBox.innerHTML = "";
		changeControlsState("streaming");

		return (value: string) => {
			textBox.innerText += value;
		};
	}
	function endStreaming() {
		setSwipeToLast();
		changeControlsState("main");
	}
	function setIsLast(value: boolean) {
		isLast = value;
		changeSwipe(0);
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
		{ controls: viewControls },
		() => {},
		{ skipInitialRender: true }
	);
	return wrapped;
}
export type RampikeMessageView = ReturnType<typeof makeMessageView>;

export async function loadPictures(chat: Chat) {
	return await Promise.all([
		chat.userPersona.picture && getBlobLink(chat.userPersona.picture),
		chat.scenario.picture    && getBlobLink(chat.scenario.picture)
	]);
}
