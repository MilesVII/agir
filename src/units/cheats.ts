import { local } from "@root/persist";
import { toast } from "./toasts";

let cheatLockCounter = 7;
const cheatCodes: Record<string, any> = {
	"ee7668710593603e1bf765b32d532ac6b3c5b6f9": gibbadge
};

export function cheatsUnit() {
	const cheats = getCheats();
	if (cheats["badge"]) {
		const [caption, type] = cheats["badge"];
		const badge = document.querySelector<HTMLElement>("#settings-badge")!;
		if (badge && caption && type) {
			badge.classList.add(`badge-${type}`);
			badge.textContent = caption;
			badge.hidden = false;
		}
	}
}

export async function cheatHandler() {
	if (cheatLockCounter > 0) {
		--cheatLockCounter;
		if (cheatLockCounter < 3) {
			toast(`you are ${cheatLockCounter + 1} taps away from becoming a VIP`, { timeoutMS: 2000 });
		}
		return;
	}

	const code = prompt("enter your code");
	if (!code) return;
	const [cheat, ...params] = code.split(":");
	const cheatHandler = await hashsum(cheat);
	cheatCodes[cheatHandler]?.(...(params.map(deob)));
}

async function hashsum(message: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const hash = await window.crypto.subtle.digest("SHA-1", data);
	// @ts-ignore
	const hashHex = new Uint8Array(hash)?.toHex(); // Convert ArrayBuffer to hex string.
	return hashHex;
}

function gibbadge(text: string, type: string = "aurora") {
	addCheats({
		"badge": [text, type]
	});
}

export function getCheats() {
	const raw = local.get("cheats");
	if (!raw) return {};
	return JSON.parse(raw);
}
function addCheats(v: Record<string, any>) {
	const old = getCheats();
	local.set("cheats", JSON.stringify({ ...old, ...v }));
}

// function obf(raw: string) {
// 	const bytes = new TextEncoder().encode(raw);
// 	const binaryString = String.fromCodePoint(...bytes);
// 	return btoa(binaryString);
// }
function deob(raw: string) {
	const binaryString = atob(raw);
	const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}
