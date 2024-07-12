import jsdom from 'jsdom';
import { DOMWindow } from 'jsdom';
import type MarkdownIt from 'markdown-it';
import { getFileInfo } from './utils';
import { Config } from '.';
declare global {
    var EWiki: {
        config: Config;
        plugins: Plugin[];
        JSDOM: typeof jsdom.JSDOM;
    };
}
export interface MarkdownContext {
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
    onRenderFinish?: () => void;
};
export type FileInfo = ReturnType<typeof getFileInfo>;
