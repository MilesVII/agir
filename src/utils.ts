import { marked } from "marked";
import * as dompurify from "dompurify";

import type { Result } from "./types";

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
	const update = () => {
		textarea.style.height = "auto";
		textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight + 7)}px`;
	};
	textarea.addEventListener("input", update);
	update();
}

export function getRoute() {
	return window.location.hash.slice(1).split(".");
}

export function renderMD(content: string) {
	return dompurify.default.sanitize(marked.parse(content, { async: false }));
}
