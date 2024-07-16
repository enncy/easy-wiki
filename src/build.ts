import { Config } from './cmd';
import { renderMarkdownTo } from './core/markdown';
import { join, resolve } from 'path';
import { glob } from 'glob';
import fs from 'fs';
import { changeParentFolder, getFileInfo, getMarkdownContext, printBuildInfo } from './utils';
import chalk from 'chalk';
import { FileInfo } from './interface';
import fse from 'fs-extra';

export async function buildAll(cfg: Config) {
	copyOtherResources(cfg);

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
	const files = await glob(join(cfg.sources_folder, '**/*.md').replace(/\\/g, '/'), { ignore: cfg.ignore_sources });

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

// 复制其他资源文件
async function copyOtherResources(cfg: Config) {
	const files = await glob(join(cfg.sources_folder, '**/*.*').replace(/\\/g, '/'), {
		ignore: [
			...cfg.ignore_sources,
			// 忽略所有的md文件
			'**/*.md'
		]
	});

	for (const file of files) {
		fse.copySync(resolve(file), changeParentFolder(cfg.sources_folder, cfg.output_folder, file), {
			overwrite: true
		});
	}
}
