import MarkdownIt from 'markdown-it';
import Anchor from 'markdown-it-anchor';
import { markdownContainer } from './markdown.container';
import hljs from 'highlight.js';
import fs from 'fs';
import { plugins } from '..';
import { JSDOM } from 'jsdom';
import { resolve } from 'path';
import { getMarkdownContext, parseMarkdownContext } from '../utils';

export let MarkdownItInstance = undefined as undefined | MarkdownIt;

function createMarkdownItInstance() {
	// @ts-ignore full options list (defaults)
	const instance: MarkdownIt = MarkdownIt({
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
	});

	instance
		// 自定义 container
		.use(markdownContainer)
		// 锚点
		.use(Anchor, {
			permalink: true,
			permalinkBefore: true,
			// 锚点标识
			permalinkSymbol: '#'
		});

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

export function renderMarkdownTo(content: string, path: string) {
	const ctx = getMarkdownContext(content);
	const html = renderMarkdownAsHtml(ctx.content);
	const dom = new JSDOM(html);
	dom.window.addEventListener('load', () => {
		for (const plugin of plugins) {
			plugin.onHtmlFileRender(resolve(path), ctx, dom.window);
		}
		fs.writeFileSync(path, dom.serialize());
	});
}
