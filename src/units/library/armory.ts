import { RampikeModal } from "@rampike/modal";
import { RampikeTabs } from "@rampike/tabs";
import { idb, local } from "@root/persist";
import { ScenarioCard } from "@root/types";
import { nothrowAsync, reportingFetch } from "@root/utils";
import { importScenario } from "@units/library";
import { placeholderView } from "@views/common";
import { makeArmoryItemView } from "@views/armory-item";
import { makeArmoryCardView } from "@views/armory-card";

type Armory = {
	id: string,
	name: string,
	url: string
};
type ArmoryItem = {
	id: string,
	summary: string
	icon: string | null,
	url: string
	lastUpdate: number
};
type ArmoryResponse = {
	name?: string,
	pages: {
		current: number,
		totalItems: number,
		totalPages: number,
		perpage: number
	},
	items: ArmoryItem[]
};

export function startArmory() {
	const modal = document.querySelector<RampikeModal>  ("#library-armory")!;
	const tabs  = document.querySelector<RampikeTabs>   ("#library-armory-tabs")!;
	const list  = document.querySelector<HTMLDivElement>("#library-armory-list")!;
	const addButton = document.querySelector<HTMLButtonElement>("#library-armory-add-button")!;
	const addInput  = document.querySelector<HTMLInputElement>("#library-armory-add-input")!;
	const view = {
		back:   document.querySelector<HTMLButtonElement>("#library-armory-view-back")!,
		title:  document.querySelector<HTMLElement>("#library-armory-view-title")!,
		status: document.querySelector<HTMLElement>("#library-armory-view-status")!,
		items:  document.querySelector<HTMLElement>("#library-armory-view-items")!
	};

	tabs.tab = "list";
	const libraryPromise = idb.getAll("scenarios");

	addButton.addEventListener("click", () => {
		const url = addInput.value;
		if (!url.trim()) return;
		addInput.value = "";
		addArmory({
			id: crypto.randomUUID(),
			name: url,
			url
		});
		refresh();
	});
	view.back.addEventListener("click", () => tabs.tab = "list");


	const refresh = () => refreshList(
		list,
		id => {
			if (!confirm("This armory will be deleted from device. You can add it again later by adding its link")) return;
			deleteArmory(id);
			refresh();
		},
		openArmory
	);
	refresh();

	async function openArmory(a: Armory) {
		view.title.textContent  = a.name;
		view.status.textContent = "Loading...";
		view.status.hidden = false;
		view.items.innerHTML    = "";
		tabs.tab = "view";

		const response = await nothrowAsync(fetch(a.url));
		if (!response.success || !response.value.ok) {
			view.status.textContent = "Armory cannot be reached";
			return;
		}
		
		const payload = await nothrowAsync(response.value.json());
		if (!payload.success) {
			view.status.textContent = "Armory response is invalid";
			return;
		}

		view.status.hidden = true;
		const parsed = payload.value as ArmoryResponse;
		if (parsed.name) {
			deleteArmory(a.id);
			addArmory({
				id: a.id,
				name: parsed.name,
				url: a.url
			});
			refresh();
			view.title.textContent = parsed.name;
		}

		// TODO: pagination ignored for now

		const libraryResult = await libraryPromise;
		const library = libraryResult.success ? libraryResult.value : []
		const items = parsed.items
			.sort((a, b) => b.lastUpdate - a.lastUpdate)
			.map(i => armoryItemView(i, library));
		view.items.append(...items);
	}

	modal.open();
}

function refreshList(list: HTMLElement, deleteArmory: (id: string) => void, openArmory: (a: Armory) => void) {
	list.innerHTML = "";
	const armories = getArmories();
	if (armories.length === 0) {
		list.append(placeholderView("No armories added"));
	} else {
		list.append(...armories.map(a => makeArmoryItemView(a.name, {
			open:   () => openArmory(a),
			delete: () => deleteArmory(a.id)
		})));
	}
}

function armoryItemView(item: ArmoryItem, library: ScenarioCard[]) {
	const existing = library.find(c => c.id === item.id);
	const updateAvailable = existing && existing.lastUpdate < item.lastUpdate;
	const downloadable = Boolean(!existing || updateAvailable);
	const downloadCaption = "download" + (updateAvailable ? " (update available)" : "");

	const view = makeArmoryCardView(
		{ icon: item.icon, summary: item.summary, downloadCaption, downloadable },
		() => dl(item.url)
	);

	async function dl(url: string) {
		view.controls.setState("downloading");
		const response = await nothrowAsync(fetch(url));
		if (!response.success || !response.value.ok) {
			view.controls.setState("ready");
			return;
		}
		const blob = await nothrowAsync(reportingFetch(url, view.controls.setProgress));
		if (!blob.success) {
			view.controls.setState("ready");
			return;
		}
		view.controls.setState("done");
		importScenario(blob.value);
	}

	return view;
}

function getArmories(): Armory[] {
	const value = local.get("armories");
	if (!value) {
		const a = {
			id: crypto.randomUUID(),
			name: "Fenrir armory (default)",
			url: "https://fenrir.milesseventh.workers.dev/armory-meta"
		};
		local.set("armories", JSON.stringify([a]));
		return [a];
	}
	return JSON.parse(value);
}
function addArmory(a: Armory) {
	const armories = getArmories();
	armories.push(a);
	local.set("armories", JSON.stringify(armories));
}
function deleteArmory(id: string) {
	const nv = getArmories().filter(a => a.id !== id);
	local.set("armories", JSON.stringify(nv));
}
