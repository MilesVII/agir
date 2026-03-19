import { ChatMessage, Provider, Result } from "./types";
import { nothrow, nothrowAsync } from "./utils";


export let abortController: AbortController;

export async function runProvider(
	chat: ChatMessage[],
	provider: Provider,
	onChunk: (v: string) => void,
	reasoningStatus?: (on: boolean) => void
): Promise<Result<string, string>> {
	const chonks: string[] = [];
	const params = {
		model: provider.model,
		messages: chat.map(m => ({
			role: m.from === "model" ? "assistant" : m.from,
			content: m.swipes[m.from === "user" ? 0 : m.selectedSwipe] // HACK: user messages sometimes have nonzero selectedSwipe
		})),
		stream: true,
		reasoning: {
			effort: "none"
		},
		max_completion_tokens: provider.max,
		temperature: provider.temp,
		...provider.params
	};
	// @ts-ignore optional delete
	if (!provider.max) delete params.max_completion_tokens;

	try {

		abortController = new AbortController();
		const response = await fetch(provider.url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${provider.key}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(params),
			signal: abortController.signal
		});

		if (!response.ok) {
			const body = await nothrowAsync(response.text());
			if (!body.success) {
				return {
					success: false,
					error: `Status ${response.status}, unknown error`
				};
			}
			const parsed = nothrow(() => JSON.parse(body.value));
			if (!parsed.success || !parsed.value?.error?.message) {
				return {
					success: false,
					error: `Provider says "${body}"\nStatus ${response.status}`
				};
			}
			const meta = parsed.value?.error?.metadata;
			const metaWrapped = meta ? `\nMetadata:\n${JSON.stringify(meta, null, "\t")}` : ""
			return {
				success: false,
				error: `Provider says "${parsed.value.error.message}"\nStatus ${response.status}${metaWrapped}`
			};
		}

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
					if (parsed.value.error) {
						return {
							success: false,
							error: `Provider says "${JSON.stringify(parsed.value.error)}"`
						};
					}
					const delta = parsed.value.choices[0].delta;
					const content = delta.content;
					if (content) {
						reasoningStatus?.(false);
						chonks.push(content);
						onChunk(content);
					} else {
						if (delta.reasoning_content) reasoningStatus?.(true);
					}
				}
			}
		}
	} catch(e) {
		console.error(e);
	}

	let value = chonks.join("");
	if (value.includes("</think>")) {
		if (!value.includes("<think>")) {
			value = "<think>" + value;
		}
	}
	return { success: true, value };
}
