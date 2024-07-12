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

console.log('[ewiki] start cwd: ' + process.cwd());

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

program.command('init').action(init);

// 直接设置为默认命令
program
	.version('0.0.2')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		if (fs.existsSync(args.config) == false) {
			console.log(chalk.yellowBright('[WARN] config file not found , we will generate default config file first.'));
			init();
		}

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
		if (fs.existsSync(args.config) == false) {
			console.log(chalk.yellowBright('[WARN] config file not found , we will generate default config file first.'));
			init();
		}
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

function init() {
	let changes = false;

	if (fs.existsSync('./ewiki.config.json') == false) {
		changes = true;
		console.log(chalk.gray('ewiki.config.json exists'));
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
		console.log(chalk.greenBright('generated: [file] ewiki.config.json'));
	}

	// 将当前的默认样式文件和模版文件导入
	const template_path = resolve(process.cwd(), './template.html');
	const style_path = resolve(process.cwd(), './style.css');
	const readme_path = resolve(process.cwd(), './README.md');
	const plugins_folder = resolve(process.cwd(), './plugins');
	if (fs.existsSync(template_path) === false) {
		changes = true;
		fs.copyFileSync(resolve(__dirname, '../assets/template.html'), template_path);
		console.log(chalk.greenBright('generated: [file] template.html'));
	}
	if (fs.existsSync(style_path) === false) {
		changes = true;
		fs.copyFileSync(resolve(__dirname, '../assets/style.css'), style_path);
		console.log(chalk.greenBright('generated: [file] style.css'));
	}
	if (fs.existsSync(readme_path) === false) {
		changes = true;
		fs.writeFileSync(readme_path, '# Hello World');
		console.log(chalk.greenBright('generated: [file] README.md'));
	}

	if (fs.existsSync(plugins_folder) === false) {
		changes = true;
		fs.mkdirSync(plugins_folder, { recursive: true });
		console.log(chalk.greenBright('generated: [folder] plugins'));
	}

	if (changes === false) {
		console.log(chalk.greenBright('nothing changes'));
	}
}
