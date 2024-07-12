#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { buildAll } from './build';
import { watch } from './watch';
import chalk from 'chalk';
import { glob } from 'glob';
import { join, resolve } from 'path';
import TimeWriterPlugin from './default-plugins/time_writer';
import InfoWriterPlugin from './default-plugins/info_writer';

console.log('[ewiki] start cwd: ' + process.cwd());
global.EWiki = {
	plugins: [new TimeWriterPlugin(), new InfoWriterPlugin()],
	config: undefined as unknown as Config,
	JSDOM: require('jsdom').JSDOM
};

export interface Config {
	sources_folder: string;
	plugins_folder: string;
	scripts_folder: string;
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

program
	.command('init')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => init(args.config));

// 直接设置为默认命令
program
	.version('0.0.3')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		if (fs.existsSync(args.config) == false) {
			console.log(chalk.yellowBright('[WARN] config file not found , we will generate default config file first.'));
			init(args.config);
		}

		EWiki.config = JSON.parse(fs.readFileSync(args.config).toString());
		loadPlugins(EWiki.config!).then(() => {
			buildAll(EWiki.config!);
		});
	});

program
	.command('watch')
	.version('0.0.3')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		if (fs.existsSync(args.config) == false) {
			console.log(chalk.yellowBright('[WARN] config file not found , we will generate default config file first.'));
			init(args.config);
		}
		EWiki.config = JSON.parse(fs.readFileSync(args.config).toString());
		loadPlugins(EWiki.config!).then(() => {
			watch(EWiki.config!);
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
			EWiki.plugins.push(new plu());
		} else {
			EWiki.plugins.push(plu);
		}
	}

	console.log('plugins load finish\n');
}

function init(config_path: string) {
	let changes = false;

	if (fs.existsSync(config_path) == false) {
		changes = true;
		console.log(chalk.gray('ewiki.config.json exists'));
		// 创建默认配置文件
		fs.writeFileSync(
			config_path,
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
		console.log(chalk.greenBright('generated: [file] ' + config_path));
	}

	const cfg: Config = JSON.parse(fs.readFileSync(config_path).toString());

	// 初始化文件夹
	[cfg.plugins_folder, cfg.sources_folder, cfg.scripts_folder, cfg.output_folder].forEach((folder) => {
		const target = resolve(process.cwd(), folder);
		if (fs.existsSync(target) === false) {
			changes = true;
			fs.mkdirSync(target, { recursive: true });
			console.log(chalk.greenBright('generated: [folder] ' + folder));
		}
	});

	// 将当前的默认样式文件和模版文件导入

	const template_path = resolve(process.cwd(), cfg.html_template);
	const style_path = resolve(process.cwd(), cfg.styles[0]);
	const readme_path = resolve(process.cwd(), cfg.readme);
	const type_path = resolve(process.cwd(), './env.d.ts');

	if (fs.existsSync(template_path) === false) {
		changes = true;
		fs.copyFileSync(resolve(__dirname, '../assets/template.html'), template_path);
		console.log(chalk.greenBright('generated: [file] ' + cfg.html_template));
	}
	if (fs.existsSync(style_path) === false) {
		changes = true;
		fs.copyFileSync(resolve(__dirname, '../assets/style.css'), style_path);
		console.log(chalk.greenBright('generated: [file] ' + cfg.styles[0]));
	}
	if (fs.existsSync(readme_path) === false) {
		changes = true;
		fs.writeFileSync(readme_path, '# Hello World');
		console.log(chalk.greenBright('generated: [file] ' + cfg.readme));
	}

	// 类型文件
	if (fs.existsSync(type_path) === false) {
		changes = true;
		fs.copyFileSync(resolve(__dirname, '../lib/interface.d.ts'), type_path);
		console.log(chalk.greenBright('generated: [file] env.d.ts'));
	}

	if (changes === false) {
		console.log(chalk.greenBright('nothing changes'));
	}
}
