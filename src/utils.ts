import { marked } from "marked";
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

export function makeResizable(textarea: HTMLTextAreaElement, initialHeight: number = 52) {
	const update = () => textareaReconsider(textarea, initialHeight);
	textarea.addEventListener("input", update);
	update();
}
export function textareaReconsider(textarea: HTMLTextAreaElement, initialHeight: number = 52) {
	const bodyScroll = document.body.scrollTop;
	textarea.style.height = "auto";
	textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight + 7)}px`;
	document.body.scrollTop = bodyScroll; // why
}

export function getRoute() {
	return window.location.hash.slice(1).split(".");
}

export function renderMD(content: string) {
	return dompurify.default.sanitize(marked.parse(content, { async: false }));
}
export async function renderMDAsync(content: string) {
	return dompurify.default.sanitize(await marked.parse(content));
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
	const blob = new Blob([payload], { type: "text/plain" });
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
