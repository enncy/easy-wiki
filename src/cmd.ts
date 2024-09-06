#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { buildAll } from './build';
import { watch } from './watch';
import chalk from 'chalk';
import { glob } from 'glob';
import { resolve } from 'path';
import TimeWriterPlugin from './default-plugins/time_writer';
import InfoWriterPlugin from './default-plugins/info_writer';
import packageJson from '../package.json';
import { CommentObject, parse } from 'comment-json';

console.log('[ewiki] start cwd: ' + process.cwd());
global.EWiki = {
	plugins: [new TimeWriterPlugin(), new InfoWriterPlugin()],
	config: undefined as unknown as Config,
	JSDOM: require('jsdom').JSDOM
};

export interface Config {
	plugins: string[];
	sources_folder: string;
	output_folder: string;
	ignore_sources: string[];
	ignore_plugins: string[];
	styles: string[];
	html_template: string;
	markdown_mount: string;
	server?: {
		port?: number;
		base_url?: string;
	};
	markdown_it_config: Record<string, any>;
}

const program = new Command();
program.version(packageJson.version);

program
	.command('init')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		if (init(args.config) === false) {
			console.log(chalk.greenBright('nothing to do'));
		}
	});

// 直接设置为默认命令
program.option('--config <path>', 'config file path', './ewiki.config.json').action((args) => {
	if (fs.existsSync(args.config) == false) {
		init(args.config);
	}
	EWiki.config = parse(fs.readFileSync(args.config).toString()) as any;
	loadPlugins(EWiki.config!).then(() => {
		buildAll(EWiki.config!);
	});
});

program
	.command('watch')
	.option('--config <path>', 'config file path', './ewiki.config.json')
	.action((args) => {
		if (fs.existsSync(args.config) == false) {
			init(args.config);
		}
		EWiki.config = parse(fs.readFileSync(args.config).toString()) as any;
		loadPlugins(EWiki.config!).then(async () => {
			await buildAll(EWiki.config!);
			watch(EWiki.config!);
		});
	});

program.parse();

async function loadPlugins(config: Config) {
	// 加载插件
	const files = await glob(config.plugins, {
		ignore: config.ignore_plugins
	});

	for (const file of files) {
		try {
			const plu = require(resolve(file)).default;
			let instance = plu;
			if (typeof instance === 'function') {
				instance = new plu();
			}
			if (
				instance &&
				(Reflect.has(instance, 'onMarkdownItInit') ||
					Reflect.has(instance, 'onHtmlFileRender') ||
					Reflect.has(instance, 'onRenderFinish'))
			) {
				EWiki.plugins.push(instance);
				console.log(chalk.greenBright('plugin load success') + ' : ' + file);
			} else {
				console.log(chalk.redBright('plugin not valid') + ' : ' + file);
			}
		} catch (e) {
			console.log(chalk.redBright('plugin load failed') + ' : ' + file);
			console.error(e);
		}
	}

	// 排序
	EWiki.plugins = EWiki.plugins.sort((a, b) => {
		return (a.priority || 0) - (b.priority || 0);
	});

	console.log(chalk.blueBright('plugins load finish'));
}

function init(config_path: string) {
	let changes = false;

	if (fs.existsSync(config_path) == false) {
		changes = true;
		console.log(chalk.yellowBright('[WARN] config file not found , we will generate default config file first.'));
		// 创建默认配置文件
		fs.writeFileSync(
			config_path,
			JSON.stringify(
				{
					plugins: ['./plugins/**/*.js'],
					output_folder: './dist',
					sources_folder: './sources',
					ignore_sources: ['./**/*.ignore.md', './**/*.ignore.png', './**/*.ignore.video', './node_modules/**/*.md'],
					ignore_plugins: ['./**/*.ignore.js'],
					html_template: './template.html',
					styles: ['./style.css'],
					markdown_mount: '.markdown-body',
					server: {
						port: 3019,
						base_url: '/'
					},
					markdown_it_config: {
						html: true,
						xhtmlOut: false,
						breaks: true,
						langPrefix: 'language-',
						linkify: false,
						typographer: true,
						quotes: '“”‘’'
					}
				} as Config,
				null,
				4
			)
		);
		console.log(chalk.greenBright('generated: [file] ' + config_path));

		// 初始化文件夹
		['./sources', './plugins', './dist'].forEach((folder) => {
			const target = resolve(process.cwd(), folder);
			if (fs.existsSync(target) === false) {
				changes = true;
				fs.mkdirSync(target, { recursive: true });
				console.log(chalk.greenBright('generated: [folder] ' + folder));
			}
		});

		const index_md_path = resolve(process.cwd(), './sources/index.md');

		if (fs.existsSync(index_md_path) === false) {
			changes = true;
			fs.writeFileSync(index_md_path, 'hello world');
			console.log(chalk.greenBright('generated: [file] ./index.md'));
		}
	} else {
		console.log(chalk.gray('ewiki.config.json exists'));
	}

	const cfg: Config = parse(fs.readFileSync(config_path).toString()) as any;

	// 将当前的默认样式文件和模版文件导入

	const template_path = resolve(process.cwd(), cfg.html_template);
	const style_path = resolve(process.cwd(), cfg.styles[0]);

	if (fs.existsSync(template_path) === false) {
		changes = true;
		fs.copyFileSync(resolve(__dirname, '../../assets/template.html'), template_path);
		console.log(chalk.greenBright('generated: [file] ' + cfg.html_template));
	}
	if (fs.existsSync(style_path) === false) {
		changes = true;
		fs.copyFileSync(resolve(__dirname, '../../assets/style.css'), style_path);
		console.log(chalk.greenBright('generated: [file] ' + cfg.styles[0]));
	}

	return changes;
}
