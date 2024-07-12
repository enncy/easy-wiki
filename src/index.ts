#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { buildAll } from './build';
import { watch } from './watch';
import chalk from 'chalk';
import { glob } from 'glob';
import { Plugin } from './interface';
import { join, resolve } from 'path';
import TimeWriterPlugin from './default-plugins/time_writer';
import InfoWriterPlugin from './default-plugins/info_writer';

export const plugins: Plugin[] = [new TimeWriterPlugin(), new InfoWriterPlugin()];
export let config: Config = undefined as unknown as Config;

export interface Config {
	sources_folder: string;
	plugins_folder: string;
	output_folder: string;
	ignore_sources: string[];
	ignore_plugins: string[];
	styles: string[];
	html_template: string;
	readme: string;
	readme_mount: string;
	markdown_it_config: Record<string, any>;
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
					scripts_folder: './scripts',
					output_folder: './dist',
					ignore_sources: ['./sources/**/*.ignore.md'],
					ignore_plugins: ['./plugins/**/*.ignore.js'],
					html_template: './template.html',
					styles: ['./style.css'],
					readme: './README.md',
					readme_mount: 'body',
					markdown_it_config: {}
				} as Config,
				null,
				4
			)
		);
		// 将当前的默认样式文件和模版文件导入

		fs.copyFileSync(resolve(__dirname, '../assets/template.html'), './template.html');
		console.log(chalk.greenBright('template.html generated!'));
		fs.copyFileSync(resolve(__dirname, '../assets/style.css'), './style.css');
		console.log(chalk.greenBright('style.css generated!'));
	}

	console.log(chalk.greenBright('plugins folder generated!'));
	fs.mkdirSync('./plugins', { recursive: true });
	// 创建默认占位符插件
});

program
	.command('build')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		config = JSON.parse(fs.readFileSync(args.config).toString());
		console.log(config);

		loadPlugins(config!).then(() => {
			buildAll(config!);
		});
	});

program
	.command('watch')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		config = JSON.parse(fs.readFileSync(args.config).toString());
		loadPlugins(config!).then(() => {
			watch(config!);
		});
	});

program.parse();

async function loadPlugins(config: Config) {
	// 加载插件
	const files = await glob(join(config.plugins_folder, '**/*.js').replace(/\\/g, '/'), {
		ignore: config.ignore_plugins
	});

	for (const file of files) {
		console.log(chalk.blueBright('load plugin') + ' : ' + file);
		const plu = require(resolve(file)).default;
		if (typeof plu === 'function') {
			plugins.push(new plu());
		} else {
			plugins.push(plu);
		}
	}

	console.log('plugins load finish\n');
}
