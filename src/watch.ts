import chokidar from 'chokidar';
import chalk from 'chalk';
import { resolve, join } from 'path';
import { Config, plugins } from '.';
import fs from 'fs';
import { getMarkdownContext, parseMarkdownContext } from './utils';
import { buildOne } from './build';

export function watch(cfg: Config) {
	console.log(chalk.blueBright('\n\n[easy-wiki]:'), 'watcher running!');

	if (!fs.existsSync(cfg.output_folder)) {
		fs.mkdirSync(cfg.output_folder, { recursive: true });
	}
	chokidar.watch(join(cfg.sources_folder, '**/*.md'), { ignored: cfg.ignore_sources }).on('change', (path, stats) => {
		if (stats?.isFile) {
			const ctx = getMarkdownContext(fs.readFileSync(path).toString('utf-8'));
			for (const plugin of plugins) {
				plugin.onMarkdownChange(resolve(path), ctx);
			}
			fs.writeFileSync(path, parseMarkdownContext(ctx));
			const dest = buildOne(cfg, path);
			console.log('[easy-wiki watcher] build-finish: ' + path + ' -> ' + dest);
		}
	});
}
