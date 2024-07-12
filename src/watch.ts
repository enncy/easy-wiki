import chokidar from 'chokidar';
import chalk from 'chalk';
import { resolve, join } from 'path';
import { Config } from '.';
import fs from 'fs';
import { getFileInfo, getMarkdownContext, parseMarkdownContext, printBuildInfo } from './utils';
import { renderMarkdownTo } from './core/markdown';
import { buildReadme } from './build';

export function watch(cfg: Config) {
	console.log(chalk.blueBright('\n\n[easy-wiki]:'), 'watcher running!');

	if (!fs.existsSync(cfg.output_folder)) {
		fs.mkdirSync(cfg.output_folder, { recursive: true });
	}

	let building = false;

	chokidar.watch(cfg.readme).on('change', () => {
		if (building === true) {
			return;
		}
		building = true;
		buildReadme(cfg).then((info) => {
			if (!!info === false) {
				return;
			}
			const ctx = info.markdown_context;
			let origin_content = ctx.content;
			let origin_metadata = JSON.parse(JSON.stringify(ctx.metadata));
			for (const plugin of EWiki.plugins) {
				plugin.onMarkdownChange?.(info.filepath, ctx);
				if (origin_content !== ctx.content || JSON.stringify(origin_metadata) !== JSON.stringify(ctx.metadata)) {
					origin_content = ctx.content;
					origin_metadata = ctx.metadata;
					fs.writeFileSync(resolve(cfg.readme), parseMarkdownContext(ctx));
				}
			}

			setTimeout(() => {
				building = false;
			}, 100);
		});
	});

	chokidar.watch(join(cfg.sources_folder, '**/*.md'), { ignored: cfg.ignore_sources }).on('change', (path, stats) => {
		if (building === true) {
			return;
		}
		if (stats?.isFile()) {
			building = true;
			onChange(path, false);
			setTimeout(() => {
				building = false;
			}, 100);
		}
	});

	const onChange = (path: string, is_readme_file: boolean) => {
		const file_content = fs.readFileSync(path).toString('utf-8');
		/** 解析 markdown 上下文 */
		const ctx = getMarkdownContext(file_content, is_readme_file);
		/** 获取文件信息 */
		const info = getFileInfo(resolve(path), ctx, file_content);
		/** 解析文件 */
		info.file_content = parseMarkdownContext(ctx);
		fs.writeFileSync(path, info.file_content);

		let origin_content = ctx.content;
		let origin_metadata = JSON.parse(JSON.stringify(ctx.metadata));

		if (renderMarkdownTo(info)) {
			for (const plugin of EWiki.plugins) {
				plugin.onMarkdownChange?.(resolve(path), ctx);
				if (origin_content !== ctx.content || JSON.stringify(origin_metadata) !== JSON.stringify(ctx.metadata)) {
					origin_content = ctx.content;
					origin_metadata = ctx.metadata;
					fs.writeFileSync(path, parseMarkdownContext(ctx));
				}
			}
			printBuildInfo(info);
		}
	};
}
