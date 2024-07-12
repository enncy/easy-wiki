import chokidar from 'chokidar';
import chalk from 'chalk';
import { resolve, join } from 'path';
import { Config, plugins } from '.';
import fs from 'fs';
import { getFileInfo, getMarkdownContext, parseMarkdownContext } from './utils';
import { renderMarkdownTo } from './core/markdown';
import { buildReadme } from './build';

export function watch(cfg: Config) {
	console.log(chalk.blueBright('\n\n[easy-wiki]:'), 'watcher running!');

	if (!fs.existsSync(cfg.output_folder)) {
		fs.mkdirSync(cfg.output_folder, { recursive: true });
	}
	chokidar.watch(cfg.readme).on('change', () => buildReadme(cfg));

	chokidar.watch(join(cfg.sources_folder, '**/*.md'), { ignored: cfg.ignore_sources }).on('change', onChange);

	function onChange(path: string, stats: fs.Stats | undefined) {
		if (stats?.isFile()) {
			const file_content = fs.readFileSync(path).toString('utf-8');
			const ctx = getMarkdownContext(file_content);
			const info = getFileInfo(resolve(path), cfg, ctx, file_content);
			for (const plugin of plugins) {
				plugin.onMarkdownChange(resolve(path), ctx);
			}
			info.file_content = parseMarkdownContext(ctx);
			fs.writeFileSync(path, info.file_content);

			renderMarkdownTo(info);

			console.log(chalk.blueBright('[easy-wiki watcher] build-finish: ') + path + ' -> ' + info.dest);
		}
	}
}
