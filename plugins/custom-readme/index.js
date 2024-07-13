
// @ts-check

const fs = require('fs');
const child_process = require('child_process');
const { join, resolve } = require('path');

/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
    // 最后执行
    priority: 99,
    onMarkdownChange() {
        if (process.env.readme_not_build === 'true') {
            return
        }
        console.log('[custom-readme] rebuilding all files...');
        try {
            child_process.execSync('ewiki', { env: Object.assign(process.env, { readme_not_build: 'true' }) })
        } catch (e) {
            console.log('[custom-readme] rebuilding failed :' + e?.message || 'unknown error');
        }
        console.log('[custom-readme] rebuilding finished.');

        Object.assign(process.env, { readme_not_build: 'false' })
    },
    onRenderFinish(infos) {
        const sources = infos.filter(info => info.markdown_context.is_readme_file === false)
            // 根据文件名排序
            .sort((a, b) => a.filepath.localeCompare(b.filepath))
        let readme_info
        for (const info of infos) {
            if (info.markdown_context.is_readme_file) {
                readme_info = info
            }
        }

        if (!readme_info) {
            return
        }


        // 各个文件基本信息，添加到 html 中方便脚本处理
        const raw_infos = JSON.parse(JSON.stringify([readme_info, ...sources])).map(info => {
            // 不暴露文件路径
            info.filepath = info.filepath.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
            info.dest = info.dest.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
            Object.assign(info, { text: new EWiki.JSDOM(info.rendered_html).window.document.querySelector('.markdown-body')?.textContent || '' })
            Reflect.deleteProperty(info, 'rendered_html')
            return info
        })

        for (const file_info of infos) {
            buildFile(readme_info, sources, file_info, raw_infos)
        }
    }
}

function buildFile(
    /** @type {import('../../lib/index.d.ts').FileInfo} */
    readme_info,
    /** @type {import('../../lib/index.d.ts').FileInfo[]} */
    sources,
    /** @type {import('../../lib/index.d.ts').FileInfo} */
    file_info,
    raw_infos
) {
    fs.readFile(file_info.dest, { encoding: 'utf-8' }, (err, html) => {
        if (err) {
            return console.log('[custom-readme] error: ' + err);
        }

        const jsdom = new EWiki.JSDOM(html)
        const { window: { document } } = jsdom

        // 添加全局变量信息
        const script = document.createElement('script');
        script.innerHTML = `window.__ewiki_files_info__ = JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(raw_infos))}"));`;
        document.head.append(script);


        const sidebar = document.querySelector('.sidebar')
        if (!sidebar) {
            return
        }


        // 添加首页链接
        const parts = getFilepathParts(readme_info.filepath)
        const a = document.createElement('a')
        const name = readme_info.markdown_context.metadata.sidebar || [...parts].slice(-1)[0]
        a.textContent = name
        a.setAttribute('href', join(readme_info.markdown_context.metadata.sidebar_url_base || '', readme_info.dest.replace(process.cwd(), '').replace(/\\/g, '/')))
        sidebar.append(a)

        // 生成各级别父元素
        for (const source of sources) {
            if (source.markdown_context.metadata.sidebar == undefined) {
                continue
            }
            // 去掉 文件名，只要中间部分
            const parts = getFilepathParts(source.filepath).slice(0, -1)

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

            const parts = getFilepathParts(source.filepath)
            const parent = [...parts].slice(0, -1).map(p => `[data-folder="${p}"]`).join(' ')
            const folder = sidebar.querySelector(parent)
            const a = document.createElement('a')

            if (source.markdown_context.metadata.sidebar != undefined) {
                const name = source.markdown_context.metadata.sidebar || [...parts].slice(-1)[0]
                a.textContent = name
                const href = join(readme_info.markdown_context.metadata.sidebar_url_base || '', source.dest.replace(process.cwd(), '').replace(/\\/g, '/'))
                a.setAttribute('href', href)
                if (folder) {
                    folder.appendChild(a)
                    folder.setAttribute('open', '')
                }
            }
        }

        fs.writeFile(file_info.dest, jsdom.serialize(), { encoding: 'utf-8' }, (err) => {
            if (err) {
                console.log('[custom-readme] error: ' + err);
            }
        })
    })

}


function getFilepathParts(filepath) {
    return filepath.replace(process.cwd(), '').replace(/\\/g, '/').split('/').filter(s => s.trim())
}