import { basename, dirname, join, resolve } from 'path';
import { FileInfo, MarkdownContext } from './interface';
import fs from 'fs';
import chalk from 'chalk';

export function getMarkdownContext(content: string) {
	const reg = /^-{2,}ewiki-config-{2,}\s([\s\S]+?)\s-{2,}ewiki-config-{2,}/;
	const [_, info] = content.match(reg) || [];
	const _content = content.replace(reg, '');
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
	return { metadata, content: _content || content };
}

export function parseMarkdownContext(ctx: MarkdownContext) {
	if (ctx.content.length === 0) {
		console.log(ctx);
		throw new Error('ctx content is empty!');
	}

	return [
		'---ewiki-config---',
		...Object.entries(ctx.metadata).map(([key, value]) => `${key}=${value}`),
		'---ewiki-config---' + (ctx.content.startsWith('\n') ? ctx.content : '\n' + ctx.content)
	].join('\n');
}

export function getFileInfo(filepath: string, ctx: MarkdownContext, file_content?: string) {
	const stat = fs.statSync(filepath);
	const dir = join(dirname(filepath).replace(process.cwd(), '')).replace(/\\/g, '/');
	const filename = basename(filepath);
	const content = file_content ?? fs.readFileSync(filepath).toString('utf-8');

	return {
		dirname: dir,
		filename: filename,
		filepath: filepath,
		dest: resolve(join(EWiki.config.output_folder, join(dir, '../', filename.slice(0, -3) + '.html'))),
		create_at: stat.birthtime.getTime(),
		update_at: stat.mtime.getTime(),
		file_content: content,
		markdown_context: ctx
	};
}

export function printBuildInfo(info: FileInfo) {
	console.log(
		chalk.blueBright(`[easy-wiki builder] ${new Date().toLocaleTimeString()} build-finish: `) +
			info.filepath.replace(process.cwd(), '').replace(/\\/g, '/') +
			' -> ' +
			info.dest.replace(process.cwd(), '').replace(/\\/g, '/')
	);
}
