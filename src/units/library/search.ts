import { ScenarioCard } from "@root/types";

export function filterBySearch(cards: ScenarioCard[]) {
	const params = getSearchParams();
	if (!params) return cards;
	return cards.filter(params.filter);
}

function getSearchParams() {
	const search = {
		dialog: document.querySelector<HTMLElement>("#library-search-dialog")!,
		input: document.querySelector<HTMLInputElement>("#library-search-input")!,
		filters: {
			ct: document.querySelector<HTMLInputElement>("#library-search-f-ct")!,
			cd: document.querySelector<HTMLInputElement>("#library-search-f-cd")!,
			tg: document.querySelector<HTMLInputElement>("#library-search-f-tg")!,
			cn: document.querySelector<HTMLInputElement>("#library-search-f-cn")!,
			an: document.querySelector<HTMLInputElement>("#library-search-f-an")!,
			cp: document.querySelector<HTMLInputElement>("#library-search-f-cp")!,
			co: document.querySelector<HTMLInputElement>("#library-search-f-co")!
		}
	};

	const q = search.input.value.trim().toLowerCase();
	if (search.dialog.hidden || !search.dialog.dataset.active || !q) return null;

	return {
		query: q,
		filter: (card: ScenarioCard) => {
			if (search.filters.ct.checked && card.card.title?.toLowerCase().includes(q)) return true;
			if (search.filters.cd.checked && card.card.description.toLowerCase().includes(q)) return true;
			if (search.filters.tg.checked && card.card.tags?.some(t => t.toLowerCase().includes(q))) return true;
			if (search.filters.cn.checked && card.chat.name?.toLowerCase().includes(q)) return true;
			if (search.filters.an.checked && card.card.author?.name?.toLowerCase().includes(q)) return true;
			if (search.filters.an.checked && card.card.author?.url?.toLowerCase().includes(q)) return true;
			if (search.filters.cp.checked && card.chat.definition.toLowerCase().includes(q)) return true;
			if (search.filters.ct.checked && card.chat.initials.some(m => m.toLowerCase().includes(q))) return true;
			return false;
		}
	}
}
