import { RampikeFilePicker } from "@rampike/filepicker";
import { RampikeUnit } from "./types";
import { nothrow, nothrowAsync } from "@root/utils";
import { ChatMessage } from "@root/types";

export const mainUnit: RampikeUnit = {
	init: () => {
		const chatImport = document.querySelector<RampikeFilePicker>("#main-chats-import")!;
		chatImport.addEventListener("input", async () => {
			// todo ask to pick a persona
			const file = chatImport.input.files?.[0];
			if (!file) return;

			const raw = await nothrowAsync(file.text());
			if (!raw.success) return;
			const messages = raw.value
				.split("\n")
				.filter(l => l.trim())
				.map(l => nothrow<STCMessage>(JSON.parse(l)))
				.filter(c => c.success)
				.map(c => stcToInternal(c.value));
		})
	}
}

function stcToInternal(stc: STCMessage): ChatMessage {
	return {
		id: crypto.randomUUID(),
		from: stc.is_system
			? "system"
			: stc.is_user
				? "user"
				: "model",
		name: stc.name,
		swipes: stc.swipes ?? [stc.mes],
		selectedSwipe: 0,
		rember: null
	};
}

type STCMessage = {
	name: string,
	is_user: boolean,
	is_system: boolean,
	mes: string,
	swipes?: string[]
}
