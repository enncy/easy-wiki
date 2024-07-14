import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import { dirname, resolve } from 'path';
import { FileInfo } from '../interface';
import chalk from 'chalk';

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
				linkify: false,
				typographer: true,
				quotes: '“”‘’',
				highlight: function (str, lang) {
					if (lang && hljs.getLanguage(lang)) {
						try {
							return (
								'<pre class="hljs custom"><code>' +
								hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
								'</code></pre>'
							);
						} catch (__) {}
					}

					return '<pre class="hljs"><code>' + instance.utils.escapeHtml(str) + '</code></pre>';
				}
			} as MarkdownIt.Options,
			EWiki.config.markdown_it_config || {}
		)
	);
	return instance;
}

export function renderMarkdownAsHtml(content: string) {
	if (MarkdownItInstance === undefined) {
		let init = createMarkdownItInstance();
		for (const plugin of EWiki.plugins) {
			plugin.onMarkdownItInit?.(init);
		}
		MarkdownItInstance = init;
	}
	return MarkdownItInstance!.render(content);
}

export function renderMarkdownTo(file_info: FileInfo) {
	// 解析md文件成为html
	const html = renderMarkdownAsHtml(file_info.markdown_context.content);

	// 获取模版文件
	let template = '';
	const defined_template = file_info.markdown_context.metadata.template;
	const mount = file_info.markdown_context.metadata.mount;
	if (defined_template) {
		if (fs.existsSync(defined_template) === false) {
			console.log(
				'[easy-wiki] error : ' + chalk.redBright('template file is not found'),
				`file: ${file_info.filename}`,
				`template: ${defined_template}`
			);
			return;
		}
		template = fs.readFileSync(resolve(process.cwd(), defined_template)).toString('utf-8');
	} else {
		template = fs.readFileSync(resolve(EWiki.config.html_template)).toString('utf-8');
	}

	// 解析模版文件成 dom
	const dom = new JSDOM(template);
	// 绑定解析后的html
	if (mount) {
		const mount_el = dom.window.document.querySelector(mount);
		if (mount_el) {
			mount_el.innerHTML = html;
		} else {
			console.log('[easy-wiki] warn : mount element is not found', `file: ${file_info.filename}`, `mount: ${mount}`);
		}
	} else if (EWiki.config.markdown_mount) {
		const mount_el = dom.window.document.querySelector(EWiki.config.markdown_mount);
		if (mount_el) {
			mount_el.innerHTML = html;
		} else {
			console.log(
				'[easy-wiki] warn : mount element is not found',
				`file: ${file_info.filename}`,
				`mount: ${EWiki.config.markdown_mount}`
			);
		}
	} else {
		dom.window.document.body.innerHTML = html;
	}
	for (const plugin of EWiki.plugins) {
		plugin.onHtmlFileRender?.(file_info.filepath, file_info.dest, file_info.markdown_context, dom.window);
	}
	// 输出文件
	if (fs.existsSync(dirname(file_info.dest)) === false) {
		fs.mkdirSync(dirname(file_info.dest), { recursive: true });
	}

	const rendered_html = dom.serialize();

	fs.writeFileSync(file_info.dest, rendered_html);

	return Object.assign(file_info, { rendered_html: rendered_html });
}
