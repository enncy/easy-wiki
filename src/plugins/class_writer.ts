import { DOMWindow } from 'jsdom';
import { MarkdownContext, Plugin } from '../interface';

export default class ClassWriterPlugin implements Plugin {
	onMarkdownItInit(markdownIt: import('markdown-it')) {}
	onMarkdownCreate(filepath: string, ctx: MarkdownContext): void {}
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void {}
	onHtmlFileRender(filepath: string, ctx: MarkdownContext, window: DOMWindow) {
		window.document.body.classList.add('markdown-body');
	}
}
