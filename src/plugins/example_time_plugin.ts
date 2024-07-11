import { DOMWindow } from 'jsdom';
import { MarkdownContext, Plugin } from '../interface';
import fs from 'fs';

export default class DefaultPlugin implements Plugin {
	onMarkdownItInit(markdownIt: import('markdown-it')) {}
	onMarkdownCreate(filepath: string, ctx: MarkdownContext): void {}
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void {
		ctx.metadata.create_at = fs.statSync(filepath).birthtime.toLocaleString();
		ctx.metadata.update_at = new Date().toLocaleString();
	}
	onHtmlFileRender(filepath: string, ctx: MarkdownContext, window: DOMWindow) {
		const document = window.document;
		const create_at = document.createElement('div');
		create_at.textContent = '创建时间: ' + (ctx.metadata.create_at || '无');
		const update_at = document.createElement('div');
		update_at.textContent = '更新时间: ' + (ctx.metadata.update_at || '无');
		document.body.prepend(update_at);
		document.body.prepend(create_at);
	}
}
