import { Config } from './cmd';
import { renderMarkdownTo } from './core/markdown';
import { resolve } from 'path';
import { glob } from 'glob';
import fs from 'fs';
import { getFileInfo, getMarkdownContext, printBuildInfo } from './utils';
import chalk from 'chalk';
import { FileInfo } from './interface';

export async function buildAll(cfg: Config) {
	const infos = await createFileInfos(cfg);

	const rendered_infos = [];

	for (const info of infos) {
		const res = renderMarkdownTo(info);
		if (res && res.rendered_html) {
			rendered_infos.push(res);
			printBuildInfo(info);
		}
	}

	for (const plugin of EWiki.plugins) {
		plugin.onRenderFinish?.(rendered_infos);
	}
}

export async function createFileInfos(cfg: Config) {
	const files = await glob(cfg.sources, { ignore: cfg.ignore_sources });
	return Promise.all(
		files.map((file) => {
			return new Promise<FileInfo>((resolve_promise, reject) => {
				fs.readFile(file, { encoding: 'utf-8' }, (err, file_content) => {
					if (err) {
						return console.log('[easy-wiki builder] ' + chalk.redBright('error') + ' : ' + err);
					}
					resolve_promise(getFileInfo(resolve(file), getMarkdownContext(file_content), file_content));
				});
			});
		})
	);
}
