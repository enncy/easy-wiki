// @ts-check
const fs = require('fs');
const { join } = require('path');

/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
    // 最后执行
    priority: 999,
    onRenderFinish(infos) {

        for (const info of infos) {

            fs.readFile(info.dest, 'utf-8', (err, html) => {
                if (err) {
                    return console.error(err)
                }

                const jsdom = new EWiki.JSDOM(html)
                const { window: { document } } = jsdom

                // 获取基础链接
                const base_url = String(EWiki.config.watcher?.base_url?.trim() || '/')


                // 最后，优化全部路径 
                document.querySelectorAll('img, video, audio')?.forEach(el => {
                    const src = el.getAttribute('src')
                    if (src && src.startsWith('.')) {
                        el.setAttribute('src', join(base_url, changeParentFolder(EWiki.config.output_folder, base_url, src)).replace(/\\/g, '/'))
                    }
                })
                document.querySelectorAll('a')?.forEach(el => {
                    let href = el.getAttribute('href')
                    if (href && href.startsWith('.')) {
                        if (href.endsWith('.md')) {
                            href = href.replace('.md', '.html')
                        }
                        el.setAttribute('href', join(base_url, changeParentFolder(EWiki.config.output_folder, base_url, href)).replace(/\\/g, '/'))
                    }
                })
            })
        }

    }
}


function changeParentFolder(origin_folder, dest_folder, filepath) {
    return optimizePath(filepath).replace(optimizePath(origin_folder), optimizePath(dest_folder));
}

function optimizePath(filepath) {
    return filepath.replace(/\\/g, '/').split('/').filter(s => s !== '.').filter(s => s.trim()).join('/')
}
