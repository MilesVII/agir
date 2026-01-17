import { fromTemplateFirst } from "rampike";


const STORAGE_KEY_THEME = "theme";
const CSS_THEMES_FILE = "theme.css";

export function initTheme() {
	const theme = window.localStorage.getItem(STORAGE_KEY_THEME);
	if (theme) switchTheme(theme);

	const rules: CSSStyleRule[] = []
	for (const ss of Array.from(document.styleSheets))
		if (ss.href?.includes(CSS_THEMES_FILE)) {
			const raw = [...Array.from(ss.cssRules)];
			rules.push(...raw.filter(r => r.constructor.name === "CSSStyleRule") as any);
		}

	// @ts-ignore
	const themes: RegExpMatchArray[] = rules
		.map(r => r.selectorText.match(/\.theme-(.*)/))
		.filter(r => r);

	document.querySelector("#settings-themes")?.append(...themes.map(t => selectorItem(t[1])));
}

function selectorItem(name: string) {
	const template = document.querySelector<HTMLTemplateElement>("#template-theme-selector")!;
	const button = fromTemplateFirst(template)!;
	// if (!button) return null;
	const themeClassName = `theme-${name}`;
	button.classList.add(themeClassName);
	button.addEventListener("click", () => switchTheme(themeClassName))
	return button;
}

function switchTheme(themeClassName: string) {
	document.body.classList.forEach(c => {
		if (c.startsWith("theme-")) document.body.classList.remove(c);
	});
	document.body.classList.add(themeClassName);
	window.localStorage.setItem(STORAGE_KEY_THEME, themeClassName);
}
