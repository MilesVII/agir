import html from "./message.html";
import { ChatMessage } from "@root/types";
import { elementVisible, placeholder, renderMD } from "@root/utils";
import { toast } from "@units/toasts";
import { htmlTemplate, sirocco, sprout } from "rampike";
import { emit, tabGroups } from "./common";

/*
Renders one chat message. The view never mutates the message it was given:
user intent leaves as bubbling `message:*` events, and whoever handles them
updates the message object and calls `controls.refresh()`.
*/

export type MessageEvents = {
	"message:edit":   { mid: number, swipe: number, text: string },
	"message:swipe":  { mid: number, swipe: number },
	"message:reroll": { mid: number },
	"message:delete": { mid: number },
	"message:rember": { mid: number }
};
declare global {
	interface HTMLElementEventMap {
		"message:edit":   CustomEvent<MessageEvents["message:edit"]>;
		"message:swipe":  CustomEvent<MessageEvents["message:swipe"]>;
		"message:reroll": CustomEvent<MessageEvents["message:reroll"]>;
		"message:delete": CustomEvent<MessageEvents["message:delete"]>;
		"message:rember": CustomEvent<MessageEvents["message:rember"]>;
	}
}

const STATUS = {
	RESPONDING: "responding...",
	REASONING: "thinking..."
};

const template = htmlTemplate(html);
const REFS = {
	root:                HTMLDivElement,
	avatar:              HTMLImageElement,
	name:                HTMLElement,
	status:              HTMLElement,
	reasoning:           HTMLButtonElement,
	rember:              HTMLButtonElement,
	swipes:              HTMLElement,
	prev:                HTMLButtonElement,
	"swipe-caption":     HTMLElement,
	next:                HTMLButtonElement,
	edit:                HTMLButtonElement,
	copy:                HTMLButtonElement,
	reroll:              HTMLButtonElement,
	delete:              HTMLButtonElement,
	save:                HTMLButtonElement,
	cancel:              HTMLButtonElement,
	"reasoning-preview": HTMLElement,
	"reasoning-box":     HTMLElement,
	text:                HTMLElement
};

export type Pictures = [user: string | null, model: string | null];

export function makeMessageView(msg: ChatMessage, [userPic, modelPic]: Pictures, isLast: boolean) {
	const { refs: r } = sprout(template, REFS);
	const root = r.root;
	const tabs = tabGroups(root);

	root.dataset.mid = String(msg.id);
	r.avatar.src = placeholder(msg.from === "user" ? userPic : modelPic);
	r.avatar.title = `mid #${msg.id}`;
	r.name.textContent = msg.name;
	r.delete.hidden = msg.from !== "user";

	let streamNode: Text | null = null;

	r.prev.addEventListener("click", () => swipeBy(-1));
	r.next.addEventListener("click", () => swipeBy(+1));
	r.reasoning.addEventListener("click", () => r["reasoning-box"].hidden = !r["reasoning-box"].hidden);
	r.rember.addEventListener("click", () => emit(root, "message:rember", { mid: msg.id }));
	r.reroll.addEventListener("click", () => emit(root, "message:reroll", { mid: msg.id }));
	r.delete.addEventListener("click", () => emit(root, "message:delete", { mid: msg.id }));
	r.copy.addEventListener("click", async () => {
		await navigator.clipboard.writeText(currentText());
		toast("message copied to clipboard", { timeoutMS: 3200 });
	});
	r.edit.addEventListener("click", () => {
		r.text.setAttribute("contenteditable", "true");
		r.text.textContent = currentText();
		r.text.focus();
		tabs.pick("editing");
	});
	r.save.addEventListener("click", () => {
		const text = r.text.innerText;
		stopEditing();
		emit(root, "message:edit", { mid: msg.id, swipe: msg.selectedSwipe, text });
	});
	r.cancel.addEventListener("click", () => {
		stopEditing();
		refresh();
	});

	function currentText() {
		return msg.swipes[msg.selectedSwipe] ?? "";
	}
	function swipeBy(delta: number) {
		const count = msg.swipes.length;
		const swipe = (msg.selectedSwipe + delta + count) % count;
		emit(root, "message:swipe", { mid: msg.id, swipe });
	}
	function stopEditing() {
		r.text.removeAttribute("contenteditable");
		tabs.pick("main");
	}
	function setStatus(value: string | null) {
		r.status.hidden = value === null;
		r.status.textContent = value ?? "";
	}
	function scrollIntoView() {
		if (elementVisible(root))
			root.scrollIntoView({ behavior: "smooth", block: "end" });
	}

	/** Re-renders everything from the message object */
	function refresh() {
		streamNode = null;
		r.text.innerHTML = renderMD(currentText());
		r["swipe-caption"].textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
		r.swipes.hidden = !(isLast && msg.swipes.length > 1);
		r.reroll.hidden = !(msg.from === "model" && isLast);
		r.rember.hidden = !msg.rember;

		const reasoning = msg.reasoningBoxes?.[msg.selectedSwipe];
		r.reasoning.hidden = !reasoning;
		r["reasoning-box"].textContent = reasoning ?? "";
		r["reasoning-box"].hidden = true;
	}
	function setIsLast(value: boolean) {
		isLast = value;
		refresh();
	}

	function startStreaming() {
		r.text.removeAttribute("contenteditable");
		r.text.innerHTML = "";
		streamNode = document.createTextNode("");
		r.text.append(streamNode);
		r["reasoning-preview"].textContent = "";
		r["reasoning-preview"].hidden = true;
		r["reasoning-box"].hidden = true;
		tabs.pick("streaming"); // no such group: hides all controls
		setStatus(STATUS.RESPONDING);
	}
	function appendChunk(chunk: string) {
		if (!streamNode) startStreaming();
		streamNode!.appendData(chunk);
		scrollIntoView();
	}
	function addReasoningChunk(chunk: string) {
		if (!streamNode) startStreaming();
		r["reasoning-preview"].hidden = false;
		r["reasoning-preview"].append(chunk);
		r["reasoning-preview"].scrollTop = r["reasoning-preview"].scrollHeight;
	}
	function reasoningStatus(reasoning: boolean) {
		setStatus(reasoning ? STATUS.REASONING : STATUS.RESPONDING);
	}
	/** Call after the message object received the generated swipe */
	function endStreaming() {
		r["reasoning-preview"].textContent = "";
		r["reasoning-preview"].hidden = true;
		refresh();
		tabs.pick("main");
		setStatus(null);
		scrollIntoView();
	}

	refresh();
	tabs.pick("main");

	return sirocco(root, {
		mid: msg.id,
		refresh,
		setIsLast,
		startStreaming,
		appendChunk,
		addReasoningChunk,
		reasoningStatus,
		endStreaming
	}, "controls");
}
export type MessageView = ReturnType<typeof makeMessageView>;
