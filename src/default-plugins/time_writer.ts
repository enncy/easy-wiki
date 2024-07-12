import { DOMWindow } from 'jsdom';
import { MarkdownContext, Plugin } from '../interface';
import fs from 'fs';

export default class TimeWriterPlugin implements Plugin {
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void {
		if (!!ctx.metadata.create_at === false) {
			ctx.metadata.create_at = fs.statSync(filepath).birthtime.toLocaleString();
		}
		ctx.metadata.update_at = new Date().toLocaleString();
	}
}
