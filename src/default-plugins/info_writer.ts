import { DOMWindow } from 'jsdom';
import { MarkdownContext, Plugin } from '../interface';
import { getFileInfo } from '../utils';
import chalk from 'chalk';
import { resolve } from 'path';
import fs from 'fs';

const style_caches: Record<string, string> = {};
const style_errored: Record<string, string> = {};

export default class InfoWriterPlugin implements Plugin {
	priority = -1;
	onHtmlFileRender(filepath: string, dest: string, ctx: MarkdownContext, window: DOMWindow) {
		const info = getFileInfo(filepath, ctx);
		const document = window.document;

		// 添加文件基本信息
		const script = document.createElement('script');
		// 不暴露文件路径
		info.filepath = info.filepath.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
		info.dest = info.dest.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
		script.innerHTML = `window.__ewiki_info__ = JSON.parse(decodeURIComponent("${encodeURIComponent(
			JSON.stringify(info)
		)}"));`;
		document.head.append(script);

		// 添加配置信息
		const config_script = document.createElement('script');

		config_script.innerHTML = `window.__ewiki_config__ = JSON.parse(decodeURIComponent("${encodeURIComponent(
			JSON.stringify({
				base_url: EWiki.config.server?.base_url || ''
			})
		)}"));`;
		document.head.append(config_script);

		// 修改 meta 标签
		const meta_desc = document.querySelector('meta[name="description"]');
		if (meta_desc) {
			meta_desc.setAttribute('content', ctx.metadata.description || '');
		} else {
			const meta = document.createElement('meta');
			meta.name = 'description';
			meta.content = ctx.metadata.description || '';
			document.head.append(meta);
		}

		const meta_keywords = document.querySelector('meta[name="keywords"]');
		if (meta_keywords) {
			meta_keywords.setAttribute('content', ctx.metadata.keywords || '');
		} else {
			const meta = document.createElement('meta');
			meta.name = 'keywords';
			meta.content = ctx.metadata.keywords || '';
			document.head.append(meta);
		}

		// 修改 title
		document.title = ctx.metadata.title || document.title;

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
