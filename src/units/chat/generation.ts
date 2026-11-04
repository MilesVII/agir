import { Completion, ProviderHooks, runProvider } from "@root/run";
import { PromptMessage, Provider, Result } from "@root/types";
import { toast } from "@units/toasts";

/*
The single place where LLM calls start. One job at a time, one abort controller,
one busy signal for the UI to subscribe to. Adding a new kind of generation means
adding a JobKind here and a prompt builder in prompt.ts, nothing else.
*/

export type JobKind = "roleplay" | "rember" | "proofread";
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
): Promise<Result<Completion, string>> {
	if (active) return { success: false, error: `please wait until ${active.kind} generation is over` };

	const controller = new AbortController();
	active = { kind, controller };
	listeners.forEach(l => l(kind));
	const result = await runProvider(prompt, provider, { ...hooks, signal: controller.signal });
	active = null;
	listeners.forEach(l => l(null));
	return result;
}

/**
 * Tells the user a reply hit the token limit and offers to run it again with more room.
 * `rerun` gets a copy of the provider with the limit changed and the cut-off request's `seed` pinned,
 * so a provider that respects seeds repeats the same reply and carries on past the cut;
 * the stored provider is left as is.
 */
export function offerLongerRerun(what: string, provider: Provider, seed: number | null, rerun: (provider: Provider) => void) {
	if (!provider.max) {
		toast(`the ${what} was cut off by the provider's own token limit; set a max in its settings to raise it`);
		return;
	}
	// a null seed means none was sent ("seed": null in params), and the params keep saying so
	const params = seed === null ? provider.params : { ...provider.params, seed };
	const withMax = (max: number): Provider => ({ ...provider, max, params });
	toast(`the ${what} was cut off at the ${provider.max} token limit`, {
		actions: [
			[`rerun with ${provider.max * 2}`, close => { close(); rerun(withMax(provider.max * 2)); }],
			["rerun without a limit", close => { close(); rerun(withMax(0)); }],
			["dismiss", close => close()]
		]
	});
}
