import { marked, MarkedOptions } from "marked";
import * as dompurify from "dompurify";

import type { Result } from "./types";
import { mudcrack } from "rampike";

export function nothrow<T>(cb: () => T): Result<T, any> {
	try {
		return { success: true, value: cb() };
	} catch (error: any) {
		return { success: false, error };
	}
}

export function nothrowAsync<T>(cb: Promise<T>): Promise<Result<T, any>> {
	return new Promise(resolve => {
		cb
			.then(value => resolve({ success: true, value }))
			.catch(error => resolve({ success: false, error }))
	});
}

export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function revolvers<T = void>() {
	let _resolve: any;
	const promise = new Promise<T>(resolve => _resolve = resolve);
	return { promise, resolve: _resolve as ((v: T) => void) };
}

export function makeResizable(
	textarea: HTMLTextAreaElement,
	scrollParent: HTMLElement = document.body,
	initialHeight: number = 52
) {
	const update = () => textareaReconsider(textarea, scrollParent, initialHeight);
	textarea.addEventListener("input", update);
	update();
}
export function textareaReconsider(
	textarea: HTMLTextAreaElement,
	scrollParent: HTMLElement = document.body,
	initialHeight: number = 52
) {
	const bodyScroll = scrollParent.scrollTop;
	textarea.style.height = "auto";
	textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight + 7)}px`;
	scrollParent.scrollTop = bodyScroll; // why // because changing height to auto shifts the layout
	// we can't drop height = "auto" because scrollHeight is min(height we need, container height)
	// extremely stupid
	// why can't it just be normal for once
}

export function getRoute() {
	return window.location.hash.slice(1).split(".");
}

const markedOptions: MarkedOptions = {
	gfm: false
};
export function renderMD(content: string) {
	return dompurify.default.sanitize(marked.parse(content, { ...markedOptions, async: false }));
}
export async function renderMDAsync(content: string) {
	return dompurify.default.sanitize(await marked.parse(content, markedOptions));
}

const PLACHEOLDER = "assets/gfx/placeholder.png";
export function placeholder(url: string | null) {
	return url || PLACHEOLDER;
}

export function setSelectOptions(target: HTMLSelectElement, options: [id: string, caption: string][], pickFirst = false) {
	const optionsList = options.map(([id, caption]) => mudcrack({
		tagName: "option",
		attributes: {
			value: id
		},
		contents: caption
	}));

	target.innerHTML = "";
	target.append(...optionsList);
	if (pickFirst && options.length > 0)
		target.value = options[0][0];
}
export function setSelectMenu(target: HTMLSelectElement, displayCaption: string, options: [caption: string, cb: () => void][]) {
	const option = (id: string, caption: string) => mudcrack({
		tagName: "option",
		attributes: {
			value: id
		},
		contents: caption
	});
	const optionsList = options.map(([caption], ix) => option(String(ix), caption));
	const defaultOption = option("", displayCaption);

	target.innerHTML = "";
	target.append(defaultOption, ...optionsList);
	target.value = "";
	target.addEventListener("change", () => {
		if (!target.value) return;
		options.find((_, ix) => String(ix) === target.value)?.[1]();
		target.value = "";
	});
}

export function elementVisible(e: HTMLElement) {
	const rect = e.getBoundingClientRect();
	return (
		rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
		rect.bottom > 0
	);
}

export const b64Encoder = {
	encode: async function (file: Blob): Promise<string> {
		const array = await file.bytes()
		if ("toBase64" in array)
			// @ts-ignore
			return array.toBase64() as string;

		const base64url: string = await new Promise(resolve => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.readAsDataURL(file)
		});
		return base64url.slice(base64url.indexOf(',') + 1);
	},
	decode: async function (value: string) {
		const response = await fetch(`data:application/octet-stream;base64,${value}`);
		return await response.blob();
	}
}

export function download(payload: string, filename: string) {
	const blob = new Blob([payload], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	mudcrack({
		tagName: "a",
		attributes: {
			href: url,
			download: filename
		}
	}).click();
	URL.revokeObjectURL(url);
}

const MAIN_TITLE = "Ägir";
export function updateTitle(page: string | null) {
	document.title = page ? `${page} | ${MAIN_TITLE}` : MAIN_TITLE;
}

export async function asyncMap<T, R>(
	a: T[],
	map: (v: T, i: number, a: T[]) => Promise<R>
): Promise<R[]> {
	return await Promise.all(a.map(map));
}
