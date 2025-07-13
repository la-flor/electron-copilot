const BASE_URL = 'http://localhost:11434/';

export async function* streamComplete(
	Prompt: string,
): AsyncGenerator<{ chunk: string; done: boolean }> {
	const response = await fetch(BASE_URL + 'api/generate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ model: 'llama3.2', prompt: Prompt }),
	});

	let buffer = '';
	for await (const value of streamResponse(response)) {
		// Append the received chunk to the buffer
		buffer += value;
		// Split the buffer into individual JSON chunks
		const chunks = buffer.split('\n');
		buffer = chunks.pop() ?? '';

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
			if (chunk.trim() !== '') {
				try {
					const j = JSON.parse(chunk);
					if ('response' in j) {
						yield { chunk: j.response, done: j.done };
					} else if ('error' in j) {
						throw new Error(j.error);
					}
				} catch (e) {
					throw new Error(`Error parsing Ollama response: ${e} ${chunk}`);
				}
			}
		}
	}
}

async function* toAsyncIterable(
	nodeReadable: NodeJS.ReadableStream,
): AsyncGenerator<Uint8Array> {
	for await (const chunk of nodeReadable) {
		yield chunk as Uint8Array;
	}
}

async function* streamResponse(response: Response): AsyncGenerator<string> {
	if (response.status !== 200) {
		throw new Error(await response.text());
	}

	if (!response.body) {
		throw new Error('No response body returned.');
	}

	const reader = response.body.getReader();
	while (true) {
		const { done, value } = await reader.read();

		if (done) break;
		yield new TextDecoder().decode(value);
	}
}
