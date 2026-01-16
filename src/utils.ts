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
