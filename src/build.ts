import { Config } from '.';
import { renderMarkdownTo } from './core/markdown';
import { resolve } from 'path';
import { glob } from 'glob';
import fs from 'fs';
import { getFileInfo, getMarkdownContext } from './utils';

export async function buildAll(cfg: Config) {
	const infos = await createFileInfos(cfg);

	for (const info of infos) {
		renderMarkdownTo(info);
		console.log('[easy-wiki builder] build-finish: ' + info.filepath + ' -> ' + info.dest);
	}
}

export async function createFileInfos(cfg: Config) {
	const files = await glob(resolve(cfg.sources_folder, '**/*.md').replace(/\\/g, '/'), { ignore: cfg.ignore_sources });
	const infos = files.map((file) => {
		const file_content = fs.readFileSync(file).toString('utf-8');
		return getFileInfo(resolve(file), cfg, getMarkdownContext(file_content), file_content);
	});
	return infos;
}
