import { DOMWindow } from 'jsdom';
import { MarkdownContext, Plugin } from '../interface';
import fs from 'fs';

export default class TimeWriterPlugin implements Plugin {
	onMarkdownItInit(markdownIt: import('markdown-it')) {}
	onMarkdownCreate(filepath: string, ctx: MarkdownContext): void {}
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void {
		if (!!ctx.metadata.create_at === false) {
			ctx.metadata.create_at = fs.statSync(filepath).birthtime.toLocaleString();
		}
		ctx.metadata.update_at = new Date().toLocaleString();
	}
	onHtmlFileRender(filepath: string, ctx: MarkdownContext, window: DOMWindow) {}
}
