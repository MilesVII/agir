import { ChatMessage, Engine, Result } from "./types";
import { nothrow, nothrowAsync } from "./utils";


export const abortController = new AbortController();

export async function runEngine(
	chat: ChatMessage[],
	engine: Engine,
	onChunk: (v: string) => void
): Promise<Result<string, string>> {
	const chonks: string[] = [];

	try {
		const response = await fetch(engine.url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${engine.key}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: engine.model,
				messages: chat.map(m => ({
					role: m.from === "model" ? "assistant" : m.from,
					content: m.swipes[m.selectedSwipe]
				})),
				stream: true,
				reasoning: {
					effort: "none"
				}
			}),
			signal: abortController.signal
		});

		const reader = response.body?.getReader();
		if (!reader) {
			return {
				success: false,
				error: "Response body is not readable"
			}
		}

		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
		
			// Append new chunk to buffer
			buffer += decoder.decode(value, { stream: true });
		
			// Process complete lines from buffer
			while (true) {
				const lineEnd = buffer.indexOf("\n");
				if (lineEnd === -1) break;

				const line = buffer.slice(0, lineEnd).trim();
				buffer = buffer.slice(lineEnd + 1);

				if (line.startsWith("data: ")) {
					const data = line.slice(6);
					if (data === "[DONE]") break;

					const parsed = nothrow<any>(() => JSON.parse(data));
					if (!parsed.success) continue;
					const content = parsed.value.choices[0].delta.content;
					if (content) {
						chonks.push(content);
						onChunk(content);
					}
				}
			}
		}
	} catch(e) {
		console.error(e);
	}
	
	return { success: true, value: chonks.join("") };
}
