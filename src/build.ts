import { Config } from './cmd';
import { renderMarkdownTo } from './core/markdown';
import { resolve } from 'path';
import { glob } from 'glob';
import fs from 'fs';
import { getFileInfo, getMarkdownContext, printBuildInfo } from './utils';
import chalk from 'chalk';

export async function buildReadme(cfg: Config) {
	if (fs.existsSync(cfg.readme)) {
		const readme = resolve(cfg.readme);
		const content = fs.readFileSync(readme).toString('utf-8');
		const ctx = getMarkdownContext(content, true);
		const info = getFileInfo(readme, ctx, content);
		info.dest = resolve('./index.html');
		const res = renderMarkdownTo(info);
		if (res) {
			console.log('[easy-wiki builder] readme build finish!');
			return res;
		}
	} else {
		console.log('[easy-wiki builder] ' + chalk.yellowBright('readme not found'));
	}
}

export async function buildAll(cfg: Config) {
	let readme_info;
	if (cfg.readme) {
		readme_info = await buildReadme(cfg);
	}

	const infos = await createFileInfos(cfg);

	const rendered_infos = [];

	for (const info of infos) {
		const res = renderMarkdownTo(info);
		if (res && res.rendered_html) {
			rendered_infos.push(res);
			printBuildInfo(info);
		}
	}

	if (readme_info) {
		rendered_infos.push(readme_info);
	}

	for (const plugin of EWiki.plugins) {
		plugin.onRenderFinish?.(rendered_infos);
	}
}

export async function createFileInfos(cfg: Config) {
	const files = await glob(cfg.sources, { ignore: cfg.ignore_sources });
	const infos = files.map((file) => {
		const file_content = fs.readFileSync(file).toString('utf-8');
		return getFileInfo(resolve(file), getMarkdownContext(file_content, false), file_content);
	});
	return infos;
}
