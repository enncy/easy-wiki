#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { buildAll } from './build';
import { watch } from './watch';
import chalk from 'chalk';
import { glob } from 'glob';
import { Plugin } from './interface';
import { join, resolve } from 'path';

export const plugins: Plugin[] = [];

export interface Config {
	sources_folder: string;
	plugins_folder: string;
	output_folder: string;
	ignore_sources: string[];
	ignore_plugins: string[];
}

const program = new Command();

program.command('init').action(() => {
	if (fs.existsSync('./ewiki.config.json')) {
		console.log(chalk.gray('ewiki.config.json exists'));
	} else {
		console.log(chalk.greenBright('ewiki.config.json generated!'));
		// 创建默认配置文件
		fs.writeFileSync(
			'./ewiki.config.json',
			JSON.stringify(
				{
					sources_folder: './sources',
					plugins_folder: './plugins',
					output_folder: './',
					ignore_sources: ['./sources/**/*.ignore.md'],
					ignore_plugins: ['./plugins/**/*.ignore.js']
				} as Config,
				null,
				4
			)
		);
	}

	console.log(chalk.greenBright('plugins folder generated!'));
	fs.mkdirSync('./plugins', { recursive: true });
	// 创建默认占位符插件
});

program
	.command('build')
	.version('1.0.0')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		const config = JSON.parse(fs.readFileSync(args.config).toString());
		loadPlugins(config);
		buildAll(config);
	});

program
	.command('watch')
	.version('1.0.0')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		const config = JSON.parse(fs.readFileSync(args.config).toString());
		loadPlugins(config);
		watch(config);
	});

program.parse(process.argv);

function loadPlugins(config: Config) {
	// 加载插件
	glob(join(config.plugins_folder, '**/*.js').replace(/\\/g, '/'), { ignore: config.ignore_plugins }).then((files) => {
		for (const file of files) {
			console.log('load plugin : ' + file);
			const plu = require(resolve(file)).default;
			if (typeof plu === 'function') {
				plugins.push(new plu());
			} else {
				plugins.push(plu);
			}
		}

		console.log('plugins load finish\n');
	});
}
