import { DOMWindow } from 'jsdom';
import { MarkdownContext, Plugin } from '../interface';
import { getFileInfo } from '../utils';
import { config } from '..';
import chalk from 'chalk';
import { resolve } from 'path';
import fs from 'fs';

const style_caches: Record<string, string> = {};
const style_errored: Record<string, string> = {};

export default class InfoWriterPlugin implements Plugin {
	onMarkdownItInit(markdownIt: import('markdown-it')) {}
	onMarkdownCreate(filepath: string, ctx: MarkdownContext): void {}
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void {}
	onHtmlFileRender(filepath: string, ctx: MarkdownContext, window: DOMWindow) {
		const info = getFileInfo(filepath, config, ctx);
		const document = window.document;

		// 添加文件基本信息
		const script = document.createElement('script');
		// 不暴露文件路径
		info.filepath = info.filepath.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
		info.dest = info.dest.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
		script.innerHTML = `window.__ewiki_info__ = ${JSON.stringify(info)};`;
		document.head.append(script);

		// 添加样式文件
		[...config.styles, ...(ctx.metadata.styles || [])].forEach((style) => {
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
						console.error(`${chalk.redBright('[info-writer]')} style file not found: ${style}`);
						return;
					}
				}
				const style_tag = document.createElement('style');
				style_tag.innerHTML = style_content;
				document.head.append(style_tag);
			} else {
				style_errored[style] = 'true';
				console.error(`${chalk.redBright('[info-writer]')} style file not support: ${style}`);
			}
		});
	}
}
