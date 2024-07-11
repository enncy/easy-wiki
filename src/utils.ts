import { MarkdownContext } from './interface';

export function getMarkdownContext(content: string) {
	const [_, info, _content] = content.match(/------ewiki-config------([\s\S]+)------ewiki-config------([\s\S]+)/) || [];

	const lines =
		(info ? String(info) : '')
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean) || [];

	const metadata = Object.create({});
	for (const line of lines) {
		const [key, value] = line.split('=');
		metadata[key] = value;
	}
	return { metadata, content: _content };
}

export function parseMarkdownContext(ctx: MarkdownContext) {
	return [
		'------ewiki-config------',
		...Object.entries(ctx.metadata).map(([key, value]) => `${key}=${value}`),
		'------ewiki-config------',
		ctx.content
	].join('\n');
}
