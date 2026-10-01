import { ProviderHooks, runProvider } from "@root/run";
import { PromptMessage, Provider, Result } from "@root/types";

/*
The single place where LLM calls start. One job at a time, one abort controller,
one busy signal for the UI to subscribe to. Adding a new kind of generation means
adding a JobKind here and a prompt builder in prompt.ts, nothing else.
*/

export type JobKind = "roleplay" | "rember";
export type JobHooks = Omit<ProviderHooks, "signal">;

type JobListener = (active: JobKind | null) => void;

let active: { kind: JobKind, controller: AbortController } | null = null;
const listeners: JobListener[] = [];

export function activeJob(): JobKind | null {
	return active?.kind ?? null;
}

export function onJobChange(listener: JobListener) {
	listeners.push(listener);
}

export function cancelJob() {
	active?.controller.abort();
}

export async function runJob(
	kind: JobKind,
	provider: Provider,
	prompt: PromptMessage[],
	hooks: JobHooks
): Promise<Result<string, string>> {
	if (active) return { success: false, error: `please wait until ${active.kind} generation is over` };

	const controller = new AbortController();
	active = { kind, controller };
	listeners.forEach(l => l(kind));
	const result = await runProvider(prompt, provider, { ...hooks, signal: controller.signal });
	active = null;
	listeners.forEach(l => l(null));
	return result;
}
