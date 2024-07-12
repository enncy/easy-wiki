import { DOMWindow } from 'jsdom';
import { MarkdownContext, Plugin } from '../interface';
import { getFileInfo } from '../utils';
import chalk from 'chalk';
import { resolve } from 'path';
import fs from 'fs';

const script_caches: Record<string, string> = {};
const script_errored: Record<string, string> = {};

const style_caches: Record<string, string> = {};
const style_errored: Record<string, string> = {};

export default class InfoWriterPlugin implements Plugin {
	onHtmlFileRender(filepath: string, dest: string, ctx: MarkdownContext, window: DOMWindow) {
		const info = getFileInfo(filepath, ctx);
		const document = window.document;

		// 添加文件基本信息
		const script = document.createElement('script');
		// 不暴露文件路径
		info.filepath = info.filepath.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
		info.dest = info.dest.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
		script.innerHTML = `window.__ewiki_info__ = ${JSON.stringify(info)};`;
		document.head.append(script);
		// 添加脚本文件

		[...(ctx.metadata.scripts?.split(',') || [])].forEach((script) => {
			if (script_errored[script]) {
				return;
			}

			if (script.startsWith('http') || script.startsWith('https')) {
				const script_tag = document.createElement('script');
				script_tag.src = script;
				document.body.append(script_tag);
			} else if (script.startsWith('<script')) {
				const script_tag = document.createElement('script');
				script_tag.innerHTML = script;
				document.body.append(script_tag);
			} else if (script.endsWith('.js')) {
				let script_content = '';
				if (script_caches[script]) {
					script_content = script_caches[script];
				} else {
					if (fs.existsSync(script)) {
						script_content = fs.readFileSync(script).toString('utf-8').replace(/\n/g, '');
						script_caches[script] = script_content;
					} else {
						script_errored[script] = 'true';
						console.error(
							`${chalk.redBright('[info-writer]')} error in (${filepath}) : script file not found: ${script}`
						);
						return;
					}
				}
				const script_tag = document.createElement('script');
				script_tag.innerHTML = script_content;
				document.body.append(script_tag);
			} else {
				script_errored[script] = 'true';
				console.error(
					`${chalk.redBright('[info-writer]')} error in (${filepath}) : script file not support: ${script}`
				);
			}
		});

		// 添加样式文件
		[...EWiki.config.styles, ...(ctx.metadata.styles?.split(',') || [])].forEach((style) => {
			if (style_errored[style]) {
				return;
			}

			if (style.startsWith('http') || style.startsWith('https')) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = style;
				document.head.append(link);
			} else if (style.startsWith('<link') || style.startsWith('<style')) {
				const style_tag = document.createElement('style');
				style_tag.innerHTML = style;
				document.head.append(style_tag);
			} else if (style.endsWith('.css')) {
				let style_content = '';
				if (style_caches[style]) {
					style_content = style_caches[style];
				} else {
					if (fs.existsSync(style)) {
						style_content = fs.readFileSync(style).toString('utf-8').replace(/\n/g, '');
						style_caches[style] = style_content;
					} else {
						style_errored[style] = 'true';
						console.error(
							`${chalk.redBright('[info-writer]')} error in (${filepath}) : style file not found: ${style}`
						);
						return;
					}
				}
				const style_tag = document.createElement('style');
				style_tag.innerHTML = style_content;
				document.head.append(style_tag);
			} else {
				style_errored[style] = 'true';
				console.error(`${chalk.redBright('[info-writer]')} error in (${filepath}) : style file not support: ${style}`);
			}
		});
	}
}
