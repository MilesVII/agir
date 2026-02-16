import { ChatMessage } from "@root/types";
import { nothrow, nothrowAsync } from "@root/utils";

export async function importSTMessages(file: File) {
	const raw = await nothrowAsync(file.text());
	if (!raw.success) return [];
	const pre = raw.value
		.split("\n")
		.filter(l => l.trim())
		.map(l => nothrow<STCMessage>(() => JSON.parse(l)))
		.filter(c => c.success)
		.map((c, ix) => stcToInternal(c.value, ix));
	const text = (c: ChatMessage) => c.swipes[c.selectedSwipe];
	if (pre.length > 2 && text(pre[0]) === text(pre[1])) {
		// janitor exporter is weird
		pre.splice(0, 1);
	}
	return pre;
}

function stcToInternal(stc: STCMessage, index: number): ChatMessage {
	return {
		id: index,
		from: stc.is_system
			? "system"
			: stc.is_user
				? "user"
				: "model",
		name: stc.name,
		swipes: stc.swipes ?? [stc.mes],
		selectedSwipe: stc.swipe_id ?? 0,
		rember: null
	};
}

type STCMessage = {
	name: string,
	is_user: boolean,
	is_system: boolean,
	mes: string,
	swipes?: string[]
	swipe_id?: number
}