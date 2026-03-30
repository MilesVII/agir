import { listen, local } from "@root/persist";
import { ActiveProviders, Provider, ProviderMap, ProviderMapWithActive } from "@root/types";
import { nothrow, nothrowAsync } from "@root/utils";
import { toast } from "@units/toasts";
import { mudcrack } from "rampike";

export function providersUnit() {
	const inputs = {
		name:  document.querySelector<HTMLInputElement>("#settings-providers-name")!,
		url:   document.querySelector<HTMLInputElement>("#settings-providers-url")!,
		key:   document.querySelector<HTMLInputElement>("#settings-providers-key")!,
		model: document.querySelector<HTMLInputElement>("#settings-providers-model")!,
		temp:   document.querySelector<HTMLInputElement>("#settings-providers-temp")!,
		max:    document.querySelector<HTMLInputElement>("#settings-providers-max")!,
		params: document.querySelector<HTMLInputElement>("#settings-providers-additional")!
	};
	const defaults = {
		temp:    .9,
		max:     720
	};

	const modelsDatalist = document.querySelector("#settings-providers-models-datalist")!;
	const submitButton      = document.querySelector<HTMLButtonElement>("#settings-providers-submit")!;
	const fetchModelsButton = document.querySelector<HTMLButtonElement>("#settings-providers-fetch-models")!;
	const list = document.querySelector<HTMLElement>("#settings-providers-list")!;
	const divider = document.querySelector("#settings-providers-divider")!;
	let editing: string | null = null;

	submitButton.addEventListener("click", submit);
	fetchModelsButton.addEventListener("click", fetchModels)

	listen(update => {
		if (update.storage !== "local") return;
		if (update.key !== "providers") return;

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
		const e: Provider = {
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

		const eMap = readProviders();
		// @ts-expect-error isActive missing
		eMap[id] = e;
		saveProviders(eMap);
		editing = null;
		inputs.name.value   = "";
		inputs.url.value    = "";
		inputs.key.value    = "";
		inputs.model.value  = "";
		inputs.temp.value   = String(defaults.temp);
		inputs.max.value    = String(defaults.max);
		inputs.params.value = "";
	}
	async function fetchModels() {
		const url = inputs.url.value.trim().replace("/v1/chat/completions", "/v1/models");
		if (!url) return;
		const key = inputs.key.value;
		const closeToast = toast("calling...");
		const response = await nothrowAsync(fetch(url, {
			headers: {
				Authorization: `Bearer ${key}`,
			}
		}));
		closeToast();
		if (!response.success) {
			toast(`can't reach "${url}"\n${response.error}`);
			return;
		}
		if (!response.value.ok) {
			const text = await response.value.text();
			toast(`"${url}" returned error\nstatus ${response.value.status}\n${text.slice(0, 64)}`);
			return;
		}
		const payload = await response.value.json();
		if (!payload.data) return;
		console.log(payload.data);
		modelsDatalist.innerHTML = "";
		modelsDatalist.append(
			...payload.data.map(
				(m: any) =>
					mudcrack({
						tagName: "option",
						attributes: { value: m.id }
					})
			)
		);
		toast(`success; ${payload.data.length} models are available`);
	}
	function edit(id: string, e: Provider) {
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

		divider.scrollIntoView({ behavior: "smooth", });
	}

	function updateList() {
		modelsDatalist.innerHTML = "";
		list.innerHTML = "";
		const providersMap = readProviders();
		const providers = Object.entries(providersMap);
		const items = providers.map(([id, e]) => 
			mudcrack({
				className: "lineout row settings-provider-item",
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
										copyProvider(id);
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
										deleteProvider(id);
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
				contents: "No providers found"
			}));
	}
}

export function readProviders(): ProviderMapWithActive {
	const providersRaw = local.get("providers");
	if (!providersRaw) return {};
	const providers = nothrow<ProviderMapWithActive>(() => JSON.parse(providersRaw));
	if (!providers.success) return {};

	const ActiveProviders = readActiveProviders();
	for (const e in providers.value) {
		providers.value[e].isActive     = e === ActiveProviders.main;
		providers.value[e].remberActive = e === ActiveProviders.rember;
	}

	return providers.value;
}
function saveProviders(eMap: ProviderMap) {
	local.set("providers", JSON.stringify(eMap));
	toast("providers updated");
}
function deleteProvider(id: string) {
	if (!confirm("confirm deletion")) return;
	const e = readProviders();
	delete e[id];
	saveProviders(e);
}
function copyProvider(id: string) {
	const e = readProviders();
	if (!e[id]) return;
	const nid = crypto.randomUUID();
	e[nid] = {
		...e[id],
		name: e[id].name + " (copy)"
	};
	saveProviders(e);
}

export function readActiveProviders(): ActiveProviders {
	const defaultProviders = {
		main: null,
		rember: null
	}
	const activeRaw = local.get("activeProvider");
	if (!activeRaw) return defaultProviders;
	const parsed = nothrow<ActiveProviders>(() => JSON.parse(activeRaw));
	if (!parsed.success) return defaultProviders;

	return parsed.value;
}
