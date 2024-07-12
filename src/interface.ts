import { DOMWindow } from 'jsdom';
import type MarkdownIt from 'markdown-it';
import { getFileInfo } from './utils';

export interface MarkdownContext {
	content: string;
	metadata: {
		/** 输出绑定在页面上的元素，默认是 body ，可以根据template字段进行自定义 */
		mount?: string;
		/** 指定的模版文件，如果没有则使用配置中默认模版，如果配置也没设置，则为空白页面 */
		template?: string;
		/** 指定的样式文件，如果没有则使用配置中默认样式 */
		styles?: string[];
	} & Record<string, string>;
}

export interface Plugin {
	/** 执行优先级 */
	priority?: number;
	onMarkdownItInit(markdownIt: MarkdownIt): void;
	onMarkdownCreate(filepath: string, ctx: MarkdownContext): void;
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void;
	onHtmlFileRender(filepath: string, ctx: MarkdownContext, window: DOMWindow): void;
}

export type FileInfo = ReturnType<typeof getFileInfo>;
