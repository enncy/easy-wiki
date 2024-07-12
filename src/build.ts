import { Config } from '.';
import { renderMarkdownTo } from './core/markdown';
import { resolve } from 'path';
import { glob } from 'glob';
import fs from 'fs';
import { getFileInfo, getMarkdownContext } from './utils';
import chalk from 'chalk';

export async function buildReadme(cfg: Config) {
	if (fs.existsSync(cfg.readme)) {
		const readme = resolve(cfg.readme);
		const content = fs.readFileSync(readme).toString('utf-8');
		const info = getFileInfo(readme, cfg, getMarkdownContext(content), content);
		info.dest = resolve('./index.html');
		info.markdown_context.metadata.mount = info.markdown_context.metadata.mount || cfg.readme_mount;
		renderMarkdownTo(info);
		console.log('[easy-wiki builder] readme build finish!');
	} else {
		console.log('[easy-wiki builder] ' + chalk.yellowBright('readme not found'));
	}
}

export async function buildAll(cfg: Config) {
	if (cfg.readme) {
		buildReadme(cfg);
	}

	const infos = await createFileInfos(cfg);

	for (const info of infos) {
		renderMarkdownTo(info);
		console.log(chalk.blueBright('[easy-wiki builder] build-finish: ') + info.filepath + ' -> ' + info.dest);
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
