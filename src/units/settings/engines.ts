import { listen, local } from "@root/persist";
import { ActiveEngines, Engine, EngineMap, EngineMapWithActive } from "@root/types";
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
			temp:   document.querySelector<HTMLInputElement>("#settings-engines-temp")!,
			max:    document.querySelector<HTMLInputElement>("#settings-engines-max")!,
			params: document.querySelector<HTMLInputElement>("#settings-engines-additional")!
		};
		const defaults = {
			temp:    .9,
			max:     720
		};
		const submitButton = document.querySelector<HTMLButtonElement>("#settings-engines-submit")!;
		const list = document.querySelector<HTMLElement>("#settings-engines-list")!;
		let editing: string | null = null;

		submitButton.addEventListener("click", submit);

		listen(update => {
			if (update.storage !== "local") return;
			if (update.key !== "engines") return;

			updateList();
		});
		updateList();

		function submit() {
			const id = editing ?? crypto.randomUUID();
			function parseNumber(key: keyof typeof defaults) {
				const f = parseFloat(inputs[key].value);
				if (isNaN(f) || f < 0) return defaults[key];
				return f;
			}
			function parseParams(raw: string) {
				const result = nothrow(() => JSON.parse(raw));
				const value = result.success ? result.value : {};
				if (typeof value !== "object") return {};
				return value;
			}
			const e: Engine = {
				name:  inputs.name.value,
				url:   inputs.url.value,
				key:   inputs.key.value,
				model: inputs.model.value,
				temp:    parseNumber("temp"),
				max:     parseNumber("max"),
				params:  parseParams(inputs.params.value)
			};
			const missing = (["name", "url", "model"] as const).some(k => !e[k]);
			if (missing) return;

			const eMap = readEngines();
			// @ts-expect-error isActive missing
			eMap[id] = e;
			saveEngines(eMap);
			editing = null;
			inputs.name.value =  "";
			inputs.url.value =   "";
			inputs.key.value =   "";
			inputs.model.value = "";
			inputs.temp.value =   String(defaults.temp);
			inputs.max.value =    String(defaults.max);
			inputs.params.value = "";
		}
		function edit(id: string, e: Engine) {
			function stringifyParams() {
				if (!e.params) return "";
				if (Object.keys(e.params).length === 0) return "";

				return JSON.stringify(e.params);
			}
			editing = id;
			inputs.name.value =  e.name;
			inputs.url.value =   e.url;
			inputs.key.value =   e.key;
			inputs.model.value = e.model;
			inputs.temp.value =   String(e.temp);
			inputs.max.value =    String(e.max);
			inputs.params.value = stringifyParams();

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
							className: "row-compact",
							contents: [
								mudcrack({
									tagName: "button",
									className: "lineout",
									events: {
										click: ev => {
											ev.stopPropagation();
											copyEngine(id);
										}
									},
									contents: "copy"
								}),
								mudcrack({
									tagName: "button",
									className: "lineout",
									events: {
										click: ev => {
											ev.stopPropagation();
											deleteEngine(id);
										}
									},
									contents: "delete"
								})
							]
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
	}
}

export function readEngines(): EngineMapWithActive {
	const enginesRaw = local.get("engines");
	if (!enginesRaw) return {};
	const engines = nothrow<EngineMapWithActive>(() => JSON.parse(enginesRaw));
	if (!engines.success) return {};

	const activeEngines = readActiveEngines();
	for (const e in engines.value) {
		engines.value[e].isActive = e === activeEngines.main;
	}

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
function copyEngine(id: string) {
	const e = readEngines();
	if (!e[id]) return;
	const nid = crypto.randomUUID();
	e[nid] = {
		...e[id],
		name: e[id].name + " (copy)"
	};
	saveEngines(e);
}

export function readActiveEngines(): ActiveEngines {
	const defaultEngines = {
		main: null,
		rember: null
	}
	const activeRaw = local.get("activeEngine");
	if (!activeRaw) return defaultEngines;
	const parsed = nothrow<ActiveEngines>(() => JSON.parse(activeRaw));
	if (!parsed.success) return defaultEngines;

	return parsed.value;
}
