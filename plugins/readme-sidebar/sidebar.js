
// @ts-check

const fs = require('fs');
const { join } = require('path');

const style = fs.readFileSync(join(__dirname, './style.css')).toString();

/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
    onRenderFinish(infos) {
        const sources = infos.filter(info => info.markdown_context.is_readme_file === false)
        for (const info of infos) {
            if (info.markdown_context.is_readme_file) {
                const html = fs.readFileSync(info.dest).toString()
                const jsdom = new EWiki.JSDOM(html)
                const { window: { document } } = jsdom

                // 添加额外样式
                const style_el = document.createElement('style')
                style_el.textContent = style
                document.head.appendChild(style_el)

                const sidebar = document.querySelector('.sidebar')
                if (!sidebar) {
                    return
                }

                for (const source of sources) {
                    if (source.markdown_context.metadata.sidebar == undefined) {
                        continue
                    }

                    const parts = source.filepath.replace(process.cwd(), '').replace(/\\/g, '/').split('/').filter(s => s.trim())
                        // 去掉 文件名，只要中间部分
                        .slice(0, -1)

                    let root = null
                    for (let index = 0; index < parts.length; index++) {
                        const part = parts[index];
                        const selector = parts.slice(0, index + 1).map(p => `[data-folder="${p}"]`).join(' ')
                        const folder = sidebar.querySelector(selector)
                        // 遍历每个文件夹，并创建收缩元素
                        if (!folder) {
                            const details = document.createElement('details')
                            details.setAttribute('data-folder', part);
                            (root || sidebar).appendChild(details)
                            const summary = document.createElement('summary')
                            summary.textContent = part
                            details.appendChild(summary)

                            root = details
                        } else {
                            root = folder
                        }
                    }
                }

                // 创建链接
                for (const source of sources) {

                    const parts = source.filepath.replace(process.cwd(), '').replace(/\\/g, '/').split('/').filter(s => s.trim())

                    const parent = [...parts].slice(0, -1).map(p => `[data-folder="${p}"]`).join(' ')
                    const folder = sidebar.querySelector(parent)
                    const a = document.createElement('a')

                    if (source.markdown_context.metadata.sidebar != undefined) {
                        const name = source.markdown_context.metadata.sidebar || [...parts].slice(-1)[0]
                        a.textContent = name
                        a.setAttribute('href', join(info.markdown_context.metadata.sidebar_base || '', source.dest.replace(process.cwd(), '')))
                        if (folder) {
                            folder.appendChild(a)
                            folder.setAttribute('open', '')
                        }
                    }
                }

                fs.writeFileSync(info.dest, jsdom.serialize())
            }
        }
    }
}
