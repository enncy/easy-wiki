import { DOMWindow } from 'jsdom';
import type MarkdownIt from 'markdown-it';

export interface MarkdownContext {
	content: string;
	metadata: Record<string, string>;
}

export interface Plugin {
	onMarkdownItInit(markdownIt: MarkdownIt): void;
	onMarkdownCreate(filepath: string, ctx: MarkdownContext): void;
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void;
	onHtmlFileRender(filepath: string, ctx: MarkdownContext, window: DOMWindow): void;
}
