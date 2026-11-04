import { PromptMessage, Provider, Result } from "./types";
import { nothrow, nothrowAsync } from "./utils";

const OR_ATTRIBUTION_HEADERS = {
	"HTTP-Referer": "https://aegir", // retarded OR attribution expects me to own the whole domain for some reason
	"X-OpenRouter-Title": "Aegir (https://milesvii.github.io/agir/)", // unicode? never heard of her
	"X-OpenRouter-Categories": "roleplay"
}

export type ProviderHooks = {
	signal: AbortSignal,
	onChunk: (chunk: string) => void,
	onReasoningChunk?: (chunk: string) => void,
	onReasoningStatus?: (reasoning: boolean) => void
};

export type Completion = {
	text: string,
	/** "length" means the output was cut off by the token limit; null when the stream ended without one (or was aborted) */
	finishReason: string | null,
	/** the seed the request asked for; providers may ignore it, the API doesn't report the one actually used */
	seed: number | null
};

export async function runProvider(
	prompt: PromptMessage[],
	provider: Provider,
	hooks: ProviderHooks
): Promise<Result<Completion, string>> {
	const chonks: string[] = [];
	let finishReason: string | null = null;
	const reasoningEffort = (provider.reasoning && provider.reasoning !== "unset")
		? { reasoning: { effort: provider.reasoning } }
		: {};
	const params: Record<string, any> = {
		model: provider.model,
		messages: prompt,
		stream: true,
		...reasoningEffort,
		max_completion_tokens: provider.max,
		temperature: provider.temp,
		// a fresh seed per request keeps rerolls varied while making each one reproducible where supported
		seed: Math.floor(Math.random() * 2 ** 31),
		...provider.params
	};
	if (!provider.max) delete params.max_completion_tokens;
	// "seed": null in additional parameters opts out, for backends that reject unknown fields
	if (params.seed === null) delete params.seed;
	const seed = typeof params.seed === "number" ? params.seed : null;

	try {
		const attribution = provider.url.toLowerCase().includes("openrouter.ai/")
			? OR_ATTRIBUTION_HEADERS
			: {};
		const response = await fetch(provider.url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${provider.key}`,
				"Content-Type": "application/json",
				...attribution
			},
			body: JSON.stringify(params),
			signal: hooks.signal
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
					error: `Unparsed; Provider says "${body.value}"\nStatus ${response.status}`
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

				const line = buffer.slice(0, lineEnd);
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
					const choice = parsed.value.choices?.[0];
					if (!choice) continue; // usage-only chunks carry no choices
					if (choice.finish_reason) finishReason = choice.finish_reason;
					try {
						const delta = choice.delta ?? {};
						const reasoning = delta.reasoning || delta.reasoning_content;
						const content = delta.content;
						if (reasoning) {
							hooks.onReasoningStatus?.(true);
							hooks.onReasoningChunk?.(reasoning);
						} else if (content) {
							hooks.onReasoningStatus?.(false);
							chonks.push(content);
							hooks.onChunk(content);
						}
					} catch(e) {
						console.warn("Chunk error: ", parsed.value, e);
					}
				}
			}
		}
	} catch(e: any) {
		if (!hooks.signal.aborted)
			return {
				success: false,
				error: (e?.message as string) ?? "unknown error"
			};
	}

	const result = chonks.join("");
	const legacyReasoningSeparator = "</think>";
	if (result.includes(legacyReasoningSeparator)) {
		const [reasoning, value] = result
			.split(legacyReasoningSeparator)
			.map(v => v.trim());
		if (reasoning) hooks.onReasoningChunk?.(reasoning);
		return { success: true, value: { text: value.trim(), finishReason, seed } };
	}

	return { success: true, value: { text: result, finishReason, seed } };
}
