---ewiki-config---
create_at=2024/7/13 20:15:06
update_at=2024/7/14 13:03:33
sidebar=API
---ewiki-config---



# API

类型

```ts

/** 全局对象 */
declare global {
	var EWiki: {
		/** 配置文件 */
		config: Config;
		/** 全部已加载插件列表 */
		plugins: Plugin[];
		/** 模拟浏览器模块对象，文档：https://www.npmjs.com/package/jsdom  */
		JSDOM: typeof jsdom.JSDOM;
	};
}

/**
 * markdown 上下文，解析后的 markdown 文件会被转换为这个对象
 */
export interface MarkdownContext {
	/** 除了元数据之外的md文本 */
	content: string;
	metadata: {
		/** 输出绑定在页面上的元素，默认是 body ，可以根据template字段进行自定义 */
		mount?: string;
		/** 指定的模版文件，如果没有则使用配置中默认模版，如果配置也没设置，则为空白页面 */
		template?: string;
		/** 指定的脚本文件  */
		scripts?: string;
		/** 指定的样式文件，如果没有则使用配置中默认样式 */
		styles?: string;
	} & Record<string, string>;
	/** 标记当前文件是否为 readme 首页文件 */
	is_readme_file: boolean;
}

export type Plugin = {
	/** 执行优先级 */
	priority?: number;
	/** 当 markdown-it 对象初始化时触发 */
	onMarkdownItInit?: (markdownIt: MarkdownIt) => void;
	/** 当markdown文件发生变化时触发 */
	onMarkdownChange?: (filepath: string, ctx: MarkdownContext) => void;
	/**
	 * 渲染html文件时触发
	 * @param filepath markdown文件路径
	 * @param dest 输出文件路径
	 * @param ctx markdown上下文
	 * @param window jsdom window 对象
	 */
	onHtmlFileRender?: (filepath: string, dest: string, ctx: MarkdownContext, window: DOMWindow) => void;
	/** 当使用 build 命令完成全部渲染时调用 */
	onRenderFinish?: (file_info: (FileInfo & { rendered_html: string })[]) => void;
};

/**
 * 文件信息
 */
export interface FileInfo {
	dirname: string;
	filename: string;
	filepath: string;
	dest: string;
	create_at: number;
	update_at: number;
	file_content: string;
	markdown_context: MarkdownContext;
	/**
	 * 在最后一步渲染文件后，会将渲染后的html内容保存在这个字段中
	 */
	rendered_html?: string;
}

```