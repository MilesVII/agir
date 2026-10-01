import { listen, local } from "@root/persist";
import { makeResizable, nothrow, textareaReconsider } from "@root/utils";
import { getCheats } from "@units/cheats";
import { toast } from "@units/toasts";

/*
Device-level part of the hidden illustrate feature: the on/off switch and the ComfyUI connection.
The section only shows once the cheat code unlocked the feature. Per-chat prompts live in the chat record.
*/

export type IllustrateConfig = {
	enabled: boolean,
	url: string,
	workflow: string
};

const DEFAULT_WORKFLOW = `{
	"3": { "class_type": "KSampler", "inputs": {
		"model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0],
		"seed": {{seed}}, "steps": 25, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1
	} },
	"4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "v1-5-pruned-emaonly.safetensors" } },
	"5": { "class_type": "EmptyLatentImage", "inputs": { "width": 512, "height": 768, "batch_size": 1 } },
	"6": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": "{{prompt}}" } },
	"7": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": "lowres, bad anatomy, bad hands, text, error, worst quality, low quality" } },
	"8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
	"9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "aegir", "images": ["8", 0] } }
}`;

const DEFAULTS: IllustrateConfig = {
	enabled: true,
	url: "http://127.0.0.1:8188",
	workflow: DEFAULT_WORKFLOW
};

export function loadIllustrateConfig(): IllustrateConfig {
	const raw = local.get("illustrate");
	if (!raw) return DEFAULTS;
	const parsed = nothrow(() => JSON.parse(raw));
	if (!parsed.success) return DEFAULTS;
	return { ...DEFAULTS, ...parsed.value };
}

export function isIllustrateUnlocked() {
	return !!getCheats().illustrate;
}
export function isIllustrateEnabled() {
	return isIllustrateUnlocked() && loadIllustrateConfig().enabled;
}

export function initIllustrateSettings() {
	const section       = document.querySelector<HTMLElement>        ("#settings-illustrate")!;
	const enabledInput  = document.querySelector<HTMLInputElement>   ("#settings-illustrate-enabled")!;
	const urlInput      = document.querySelector<HTMLInputElement>   ("#settings-illustrate-url")!;
	const workflowInput = document.querySelector<HTMLTextAreaElement>("#settings-illustrate-workflow")!;
	const resetButton   = document.querySelector<HTMLButtonElement>  ("#settings-illustrate-reset")!;
	const saveButton    = document.querySelector<HTMLButtonElement>  ("#settings-illustrate-save")!;
	makeResizable(workflowInput);

	saveButton.addEventListener("click", () => {
		const config: IllustrateConfig = {
			enabled: enabledInput.checked,
			url: urlInput.value.trim(),
			workflow: workflowInput.value.trim() || DEFAULT_WORKFLOW
		};
		local.set("illustrate", JSON.stringify(config));
		toast("illustration settings updated");
	});
	resetButton.addEventListener("click", () => {
		if (!confirm("the workflow template will be replaced with the default one")) return;
		workflowInput.value = DEFAULT_WORKFLOW;
		textareaReconsider(workflowInput);
	});
	section.addEventListener("toggle", () => textareaReconsider(workflowInput));

	listen(u => {
		if (u.storage !== "local") return;
		if (u.key === "cheats") updateVisibility();
		if (u.key === "illustrate") fill();
	});
	updateVisibility();
	fill();

	function updateVisibility() {
		section.hidden = !isIllustrateUnlocked();
	}
	function fill() {
		const config = loadIllustrateConfig();
		enabledInput.checked = config.enabled;
		urlInput.value = config.url;
		workflowInput.value = config.workflow;
		textareaReconsider(workflowInput);
	}
}
