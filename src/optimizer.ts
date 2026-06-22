const SMALLER_SIZE_LIMIT = 2048;

export async function optimizeToWEBP(blob: Blob): Promise<[file: Blob, change: boolean]> {
	if (await isWebp(blob)) {
		return Promise.resolve([blob, false]);
	}

	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(blob);
	
		img.onload = () => {
			URL.revokeObjectURL(url);
	
			let { width, height } = img;
			const smallerSide = Math.min(width, height);

			if (smallerSide > SMALLER_SIZE_LIMIT) {
				const scale = SMALLER_SIZE_LIMIT / smallerSide;
				width = Math.round(width * scale);
				height = Math.round(height * scale);
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
	
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				resolve([blob, false]);
				return;
			}

			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = "high";
			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(newBlob) => resolve(newBlob ? [newBlob, true] : [blob, false]),
				"image/webp",
				0.94
			);
		};
	
		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve([blob, false])
		};
	
		img.src = url;
	});
}

async function isWebp(blob: Blob): Promise<boolean> {
	if (blob.type === "image/webp") return true;

	const header = await blob.slice(0, 12).arrayBuffer();
	const bytes = new Uint8Array(header);

	const RIFF = [0x52, 0x49, 0x46, 0x46];
	const WEBP = [0x57, 0x45, 0x42, 0x50];

	for (let i = 0; i < 4; ++i) {
		if (bytes[i] !== RIFF[i])
			return false;
		if (bytes[8 + i] !== WEBP[i])
			return false;
	}
	return true;
}
