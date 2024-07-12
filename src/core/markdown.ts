import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import fs from 'fs';
import { config, plugins } from '..';
import { JSDOM } from 'jsdom';
import { resolve } from 'path';
import { getMarkdownContext } from '../utils';
import { FileInfo } from '../interface';

export let MarkdownItInstance = undefined as undefined | MarkdownIt;

function createMarkdownItInstance() {
	// @ts-ignore full options list (defaults)
	const instance: MarkdownIt = MarkdownIt(
		Object.assign(
			{
				html: true,
				xhtmlOut: false,
				breaks: true,
				langPrefix: 'language-',
				linkify: true,
				typographer: true,
				quotes: '“”‘’',
				highlight: function (str, lang) {
					if (lang && hljs.getLanguage(lang)) {
						try {
							return (
								'<pre class="hljs"><code>' +
								hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
								'</code></pre>'
							);
						} catch (__) {}
					}

					return '<pre class="hljs"><code>' + instance.utils.escapeHtml(str) + '</code></pre>';
				}
			} as MarkdownIt.Options,
			config.markdown_it_config || {}
		)
	);
	return instance;
}

export function renderMarkdownAsHtml(content: string) {
	if (MarkdownItInstance === undefined) {
		let init = createMarkdownItInstance();
		for (const plugin of plugins) {
			plugin.onMarkdownItInit(init);
		}
		MarkdownItInstance = init;
	}
	return MarkdownItInstance!.render(content);
}

export function renderMarkdownTo(file_info: FileInfo) {
	const ctx = getMarkdownContext(file_info.file_content);
	// 解析md文件成为html
	const html = renderMarkdownAsHtml(ctx.content);

	// 获取模版文件
	let template = '';
	const defined_template = file_info.markdown_context.metadata.template;
	const mount = file_info.markdown_context.metadata.mount;
	if (defined_template) {
		template = fs.readFileSync(resolve(defined_template)).toString('utf-8');
	} else {
		template = fs.readFileSync(resolve(config.html_template)).toString('utf-8');
	}

	// 解析模版文件成 dom
	const dom = new JSDOM(template);
	// 绑定解析后的html
	dom.window.addEventListener('load', () => {
		if (mount) {
			const mount_el = dom.window.document.querySelector(mount);
			if (mount_el) {
				mount_el.innerHTML = html;
			} else {
				console.log('[easy-wiki] warn : mount element is not found', `file: ${file_info.filename}`, `mount: ${mount}`);
			}
		} else {
			dom.window.document.body.innerHTML = html;
		}
		for (const plugin of plugins) {
			plugin.onHtmlFileRender(file_info.filepath, ctx, dom.window);
		}
		// 输出文件
		fs.writeFileSync(file_info.dest, dom.serialize());
	});
}
