import { Config, plugins } from '.';
import { renderMarkdownTo } from './core/markdown';
import { resolve, dirname, basename, join } from 'path';
import { glob } from 'glob';
import fs from 'fs';

/**
 * 返回生成的文件路径
 */
export function buildOne(cfg: Config, md_path: string) {
	const dest_folder = resolve(cfg.output_folder, dirname(md_path));
	if (fs.existsSync(dest_folder) == false) {
		fs.mkdirSync(dest_folder, { recursive: true });
	}

	if (md_path.endsWith('.md')) {
		const dir = dirname(md_path);
		const filename = basename(md_path);
		const dest = resolve(cfg.output_folder, join(dir, '../', filename.slice(0, -3) + '.html'));
		renderMarkdownTo(fs.readFileSync(resolve(md_path)).toString('utf-8'), dest);
		return dest;
	}
}

export async function buildAll(cfg: Config) {
	const files = await glob(resolve(cfg.sources_folder, '**/*.md'), { ignore: cfg.ignore_sources });
	for (const file of files) {
		buildOne(cfg, file);
		console.log('[easy-wiki builder] build-finish: ' + file + ' -> ' + file.slice(0, -3) + '.html');
	}
}
