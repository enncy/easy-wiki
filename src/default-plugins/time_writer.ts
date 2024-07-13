import { FileInfo, MarkdownContext, Plugin } from '../interface';
import fs from 'fs';
import { parseMarkdownContext } from '../utils';

export default class TimeWriterPlugin implements Plugin {
	onMarkdownChange(filepath: string, ctx: MarkdownContext): void {
		if (!!ctx.metadata.create_at === false) {
			ctx.metadata.create_at = fs.statSync(filepath).birthtime.toLocaleString();
		}
		ctx.metadata.update_at = new Date().toLocaleString();
	}
	onRenderFinish(file_info: FileInfo[]) {
		for (const info of file_info) {
			const ctx = info.markdown_context;
			if (!!ctx.metadata.create_at === false) {
				ctx.metadata.create_at = fs.statSync(info.filepath).birthtime.toLocaleString();
			}
			ctx.metadata.update_at = new Date().toLocaleString();
			const md_content = parseMarkdownContext(ctx);
			// 自动更新文件信息
			fs.writeFileSync(info.filepath, md_content);
		}
	}
}
