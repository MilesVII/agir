import { getBlobLink, idb } from "@root/persist";
import { Chat, ChatMessage } from "@root/types";
import { placeholder, renderMDAsync } from "@root/utils";
import { mudcrack } from "rampike";

export async function loadMessages(chatId: string) {
	const list = document.querySelector<HTMLDivElement>("#play-messages")!;
	list.innerHTML = "";

	const [contents, meta] = await Promise.all([
		idb.get("chatContents", chatId),
		idb.get("chats", chatId)
	]);
	if (!contents.success || !meta.success) return;

	const [userPic, modelPic] = await Promise.all([
		meta.value.userPersona.picture && getBlobLink(meta.value.userPersona.picture),
		meta.value.scenario.picture    && getBlobLink(meta.value.scenario.picture)
	]);
	console.log(userPic, modelPic)

	const messages = contents.value.messages;
	const items = messages.map(item => message(item, meta.value, [userPic, modelPic]));
	list.append(...items);
}

function message(msg: ChatMessage, meta: Chat, [userPic, modelPic]: (string | null)[]) {
	const text = msg.swipes[msg.selectedSwipe];
	const textBox = mudcrack({
		tagName: "div",
		className: "message-text",
		contents: text
	});
	const swipesControl = [
		mudcrack({
			tagName: "button",
			className: "strip pointer",
			contents: "<",
			events: {
				click: () => changeSwipe(-1)
			}
		}),
		mudcrack({
			tagName: "span",
			className: "",
			contents: ""
		}),
		mudcrack({
			tagName: "button",
			className: "strip pointer",
			contents: ">",
			events: {
				click: () => changeSwipe(-1)
			}
		})
	];
	const [, swipesCaption] = swipesControl;
	const swipesControlContainer = mudcrack({
		tagName: "div",
		className: "row-compact",
		contents: swipesControl,
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
		swipesControlContainer.style.visibility = (msg.swipes.length > 1) ? "visible" : "hidden";
	}
	function ramTab(contents: string | Element[]) {
		return mudcrack({
			tagName: "div",
			className: "virtual",
			contents
		});
	}
	const controls = [
		ramTab([
			swipesControlContainer,
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
			mudcrack({
				tagName: "button",
				className: "strip pointer",
				contents: "reroll",
				events: {
					click: () => {
						alert("TODO");
					}
				}
			})
		]),
		ramTab([
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
		ramTab([])
	];
	function changeControlsState(state: "main" | "editing") {
		const tix = {
			main: 0,
			editing: 1,
			loading: 2
		}[state];
		controls.forEach((tab, i) => tab.style.display = i === tix ? "contents" : "none");
	}

	const element = mudcrack({
		className: "message",
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
	return element;
}

async function updateSwipe(chatId: string, messageId: number, swipeIx: number, value: string) {
	const contents = await idb.get("chatContents", chatId);
	if (!contents.success) return;

	const tix = contents.value.messages.findIndex(m => m.id === messageId);
	if (tix < 0) return;

	contents.value.messages[tix].swipes[swipeIx] = value;
	await idb.set("chatContents", contents.value);
}
