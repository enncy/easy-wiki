import { Config } from '.';
import { renderMarkdownTo } from './core/markdown';
import { basename, dirname, join, resolve } from 'path';
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
		info.markdown_context.metadata.mount = info.markdown_context.metadata.mount || cfg.readme_mount;
		if (renderMarkdownTo(info)) {
			console.log('[easy-wiki builder] readme build finish!');
			return info;
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

	let infos = await createFileInfos(cfg);

	for (const info of infos) {
		if (renderMarkdownTo(info)) {
			printBuildInfo(info);
		}
	}

	if (readme_info) {
		infos = [readme_info, ...infos];
	}

	for (const plugin of EWiki.plugins) {
		plugin.onRenderFinish?.(infos);
	}
}

export async function createFileInfos(cfg: Config) {
	const files = await glob(resolve(cfg.sources_folder, '**/*.md').replace(/\\/g, '/'), { ignore: cfg.ignore_sources });
	const infos = files.map((file) => {
		const file_content = fs.readFileSync(file).toString('utf-8');
		return getFileInfo(resolve(file), getMarkdownContext(file_content, false), file_content);
	});
	return infos;
}
