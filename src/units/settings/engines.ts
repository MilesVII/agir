import { listen, local } from "@root/persist";
import { Engine, EngineMap } from "@root/types";
import { nothrow } from "@root/utils";
import { RampikeUnit } from "@units/types";
import { mudcrack } from "rampike";

export const enginesUnit: RampikeUnit = {
	init: () => {
		const inputs = {
			name:  document.querySelector<HTMLInputElement>("#settings-engines-name")!,
			url:   document.querySelector<HTMLInputElement>("#settings-engines-url")!,
			key:   document.querySelector<HTMLInputElement>("#settings-engines-key")!,
			model: document.querySelector<HTMLInputElement>("#settings-engines-model")!,
			temp:    document.querySelector<HTMLInputElement>("#settings-engines-temp")!,
			max:     document.querySelector<HTMLInputElement>("#settings-engines-max")!,
			context: document.querySelector<HTMLInputElement>("#settings-engines-context")!
		};
		const defaults = {
			temp:    .9,
			max:     720,
			context: 16384
		};
		const submitButton = document.querySelector<HTMLButtonElement>("#settings-engines-submit")!;
		const list = document.querySelector<HTMLElement>("#settings-engines-list")!;
		let editing: string | null = null;

		submitButton.addEventListener("click", submit);

		function submit() {
			const id = editing ?? crypto.randomUUID();
			function parseNumber(key: keyof typeof defaults) {
				const f = parseFloat(inputs[key].value);
				if (isNaN(f) || f < 0) return defaults[key];
				return f;
			}
			const e: Engine = {
				name:  inputs.name.value,
				url:   inputs.url.value,
				key:   inputs.key.value,
				model: inputs.model.value,
				temp:    parseNumber("temp"),
				max:     parseNumber("max"),
				context: parseNumber("context")
			};
			const missing = (["name", "url", "model"] as const).some(k => !e[k]);
			if (missing) return;

			const eMap = readEngines();
			eMap[id] = e;
			saveEngines(eMap);
			editing = null;
			inputs.name.value =  "";
			inputs.url.value =   "";
			inputs.key.value =   "";
			inputs.model.value = "";
			inputs.temp.value =    String(defaults.temp);
			inputs.max.value =     String(defaults.max);
			inputs.context.value = String(defaults.context);
		}
		function edit(id: string, e: Engine) {
			editing = id;
			inputs.name.value =  e.name;
			inputs.url.value =   e.url;
			inputs.key.value =   e.key;
			inputs.model.value = e.model;
			inputs.temp.value =    String(e.temp);
			inputs.max.value =     String(e.max);
			inputs.context.value = String(e.context);

			inputs.name.scrollIntoView({ behavior: "smooth" });
		}

		function updateList() {
			list.innerHTML = "";
			const enginesMap = readEngines();
			const engines = Object.entries(enginesMap);
			const items = engines.map(([id, e]) => 
				mudcrack({
					className: "lineout row settings-engine-item",
					contents: [
						mudcrack({
							contents: e.name
						}),
						mudcrack({
							tagName: "button",
							className: "lineout",
							events: {
								click: () => deleteEngine(id)
							},
							contents: "delete"
						})
					],
					events: {
						click: () => edit(id, e)
					}
				})
			);
			if (items.length > 0)
				list.append(...items);
			else
				list.append(mudcrack({
					className: "placeholder",
					contents: "No engines found"
				}));
		}
		listen(update => {
			if (update.storage !== "local") return;
			if (update.key !== "engines") return;

			updateList();
		});
		updateList();
	}
}

export function readEngines(): EngineMap {
	const enginesRaw = local.get("engines");
	if (!enginesRaw) return {};
	const engines = nothrow<EngineMap>(() => JSON.parse(enginesRaw));
	if (!engines.success) return {};

	return engines.value;
}
function saveEngines(eMap: EngineMap) {
	local.set("engines", JSON.stringify(eMap));
}
function deleteEngine(id: string) {
	if (!confirm("confirm deletion")) return;
	const e = readEngines();
	delete e[id];
	saveEngines(e);
}
