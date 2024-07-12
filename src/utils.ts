import { basename, dirname, join, resolve } from 'path';
import { FileInfo, MarkdownContext } from './interface';
import fs from 'fs';
import { Config } from '.';
import chalk from 'chalk';

export function getMarkdownContext(content: string, is_readme_file: boolean) {
	const [_, info, _content] = content.match(/------ewiki-config------([\s\S]+)------ewiki-config------([\s\S]*)/) || [];

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
	return { metadata, content: _content || content, is_readme_file };
}

export function parseMarkdownContext(ctx: MarkdownContext) {
	return [
		'------ewiki-config------',
		...Object.entries(ctx.metadata).map(([key, value]) => `${key}=${value}`),
		'------ewiki-config------' + ctx.content
	].join('\n');
}

export function getFileInfo(filepath: string, ctx: MarkdownContext, file_content?: string) {
	const stat = fs.statSync(filepath);
	const dir = join(dirname(filepath).replace(process.cwd(), '').replace(/\\/g, '/'));
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
			info.filepath.split('\\').slice(-2).join('/') +
			' -> ' +
			info.dest.split('\\').slice(-2).join('/')
	);
}
