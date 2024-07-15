import { FileInfo, Plugin } from '../interface';
import fs from 'fs';
import { parseMarkdownContext } from '../utils';

export default class TimeWriterPlugin implements Plugin {
	onRenderFinish(file_info: FileInfo[]) {
		// 在监听模式下不对文件进行操作
		if (process.env._is_watching === 'true') {
			return;
		}
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
