import chokidar from 'chokidar';
import chalk from 'chalk';
import { resolve, join } from 'path';
import { Config } from './cmd';
import fs from 'fs';
import { getFileInfo, getMarkdownContext, parseMarkdownContext, printBuildInfo } from './utils';
import { renderMarkdownTo } from './core/markdown';
import express from 'express';

export function watch(cfg: Config) {
	const app = express();

	app.use(cfg.server?.base_url || '/', express.static(EWiki.config.output_folder));

	const port = cfg.server?.port || 3019;

	app.listen(port, () => {
		console.log(
			chalk.blueBright('\n[easy-wiki watch server]:'),
			'server running at : http://localhost:' + port + (cfg.server?.base_url || '/')
		);
		console.log(
			chalk.blueBright('[easy-wiki watch server]:'),
			`use '${EWiki.config.output_folder}' as static resource folder`
		);
		console.log('\n');
	});

	if (!fs.existsSync(cfg.output_folder)) {
		fs.mkdirSync(cfg.output_folder, { recursive: true });
	}

	let building = false;

	chokidar.watch(join(cfg.sources_folder, '**/*.md'), { ignored: cfg.ignore_sources }).on('change', (path, stats) => {
		if (building === true) {
			return;
		}
		if (stats?.isFile()) {
			building = true;
			onChange(path);
			setTimeout(() => {
				building = false;
			}, 100);
		}
	});

	const onChange = (path: string) => {
		const file_content = fs.readFileSync(path).toString('utf-8');
		// TODO : 优化，有时候会返回空字符串
		if (file_content.trim().length === 0) {
			return;
		}
		/** 解析 markdown 上下文 */
		const ctx = getMarkdownContext(file_content);
		/** 获取文件信息 */
		const info = getFileInfo(resolve(path), ctx, file_content);
		/** 解析文件 */
		info.file_content = parseMarkdownContext(ctx);
		fs.writeFileSync(path, info.file_content);

		const { rendered_html } = renderMarkdownTo(info) || {};

		if (rendered_html) {
			printBuildInfo(info);

			for (const plugin of EWiki.plugins) {
				plugin.onMarkdownChange?.(path, ctx);
			}
		}
	};
}
