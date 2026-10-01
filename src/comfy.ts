import { Result } from "./types";
import { nothrow, nothrowAsync, sleep } from "./utils";

/*
Minimal ComfyUI client: queue an API-format workflow, poll history, download the first image.
ComfyUI must run with --enable-cors-header so the browser can talk to it.
*/

export type ComfyConnection = {
	url: string,
	/** API-format workflow JSON with {{prompt}} and {{seed}} macros */
	workflow: string
};

const PROMPT_MACRO = "{{prompt}}";
const SEED_MACRO = "{{seed}}";
const POLL_MS = 1000;

type ComfyImage = { filename: string, subfolder?: string, type?: string };

export async function renderImage(
	connection: ComfyConnection,
	prompt: string,
	signal: AbortSignal,
	onStatus: (status: string) => void
): Promise<Result<Blob, string>> {
	const base = connection.url.trim().replace(/\/+$/, "");
	if (!base) return fail("ComfyUI address is not set");

	const seed = String(Math.floor(Math.random() * 2 ** 48));
	const escapedPrompt = JSON.stringify(prompt).slice(1, -1); // the macro sits inside a JSON string
	const workflow = nothrow(() => JSON.parse(
		connection.workflow
			.replaceAll(PROMPT_MACRO, escapedPrompt)
			.replaceAll(SEED_MACRO, seed)
	));
	if (!workflow.success) return fail("workflow template is not valid JSON");

	onStatus("queueing...");
	const queued = await nothrowAsync(fetch(`${base}/prompt`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ prompt: workflow.value, client_id: crypto.randomUUID() }),
		signal
	}));
	if (!queued.success) return fail(`can't reach ComfyUI at ${base}\n${queued.error?.message ?? queued.error}`);
	if (!queued.value.ok) {
		const text = await nothrowAsync(queued.value.text());
		return fail(`ComfyUI rejected the workflow (status ${queued.value.status})\n${text.success ? text.value.slice(0, 300) : ""}`);
	}
	const ticket = await nothrowAsync(queued.value.json());
	const promptId: string | undefined = ticket.success ? ticket.value?.prompt_id : undefined;
	if (!promptId) return fail("ComfyUI did not return a prompt id");

	onStatus("rendering...");
	while (true) {
		await sleep(POLL_MS);
		if (signal.aborted) return fail("cancelled");

		const history = await nothrowAsync(fetch(`${base}/history/${promptId}`, { signal }).then(r => r.json()));
		if (!history.success) continue; // transient; the abort check above ends the loop
		const entry = history.value?.[promptId];
		if (!entry) continue; // still queued or running

		if (entry.status?.status_str === "error")
			return fail(`ComfyUI failed\n${JSON.stringify(entry.status.messages ?? "").slice(0, 300)}`);

		const image = firstImage(entry.outputs);
		if (!image) {
			if (entry.status?.completed) return fail("ComfyUI finished without an image output");
			continue;
		}

		onStatus("downloading...");
		const params = new URLSearchParams({
			filename: image.filename,
			subfolder: image.subfolder ?? "",
			type: image.type ?? "output"
		});
		const file = await nothrowAsync(fetch(`${base}/view?${params}`, { signal }));
		if (!file.success || !file.value.ok) return fail("can't download the rendered image");
		return { success: true, value: await file.value.blob() };
	}
}

function firstImage(outputs: unknown): ComfyImage | null {
	for (const node of Object.values((outputs ?? {}) as Record<string, any>)) {
		const images = node?.images;
		if (Array.isArray(images) && images.length > 0) return images[0];
	}
	return null;
}

function fail(error: string): Result<Blob, string> {
	return { success: false, error };
}
