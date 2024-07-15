
// @ts-check

const fs = require('fs');
const child_process = require('child_process');
const { join, resolve } = require('path');

const style_content = fs.readFileSync(resolve(__dirname, './style.css')).toString('utf-8');

/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
    // 最后执行
    priority: 99,
    onHtmlFileRender() {
        if (process.env._not_build === 'true') {
            return
        }
        console.log('[extra-widget] rebuilding all files...');
        try {
            if (process.env._not_build === 'true') {
                return
            }
            child_process.execSync('ewiki', { env: Object.assign(process.env, { _not_build: 'true', _is_watching: 'true' }) })
        } catch (e) {
            console.log('[extra-widget] rebuilding failed :' + e?.message || 'unknown error');
        }
        console.log('[extra-widget] rebuilding finished.');
        Object.assign(process.env, { _not_build: 'false' })
    },
    onRenderFinish(infos) {
        // 根据文件名排序
        const sources = infos.sort((a, b) => a.filepath.localeCompare(b.filepath))

        // 各个文件基本信息，添加到 html 中方便脚本处理
        const raw_infos = JSON.parse(JSON.stringify(sources)).map(info => {
            // 不暴露文件路径
            info.filepath = info.filepath.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
            info.dest = info.dest.replace(resolve(process.cwd()), '').replace(/\\/g, '/');
            Object.assign(info, { text: new EWiki.JSDOM(info.rendered_html).window.document.querySelector('.markdown-body')?.textContent || '' })
            Reflect.deleteProperty(info, 'rendered_html')
            return info
        })

        for (const file_info of infos) {
            buildFile(sources, file_info, raw_infos)
        }
    }
}

function buildFile(
    /** @type {import('../../lib/index.d.ts').FileInfo[]} */
    sources,
    /** @type {import('../../lib/index.d.ts').FileInfo} */
    file_info,
    raw_infos
) {
    fs.readFile(file_info.dest, { encoding: 'utf-8' }, (err, html) => {
        if (err) {
            return console.log('[extra-widget] error: ' + err);
        }

        const jsdom = new EWiki.JSDOM(html)
        const { window: { document } } = jsdom

        // 添加全局变量信息
        const script = document.createElement('script');
        script.innerHTML = `window.__ewiki_files_info__ = JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(raw_infos))}"));`;
        document.head.append(script);

        // 添加样式
        const style = document.createElement('style')
        style.textContent = style_content
        document.head.append(style)


        // 添加顶部额外链接信息
        const header_extra_el = document.querySelector('.header .extra')
        const header_links = EWiki.config?.extra_widget_plugin?.header_links || []
        if (header_extra_el) {
            addExtraLinks(document, header_extra_el, header_links)
        } else {
            if (header_links.length > 0) {
                console.log('[extra-widget] [WARN] : header extra element not found, please add a div with class "extra" in ".header"')
            }
        }


        // 添加底部组件 
        const footer_el = document.querySelector('.footer')
        const footer_template = EWiki.config?.extra_widget_plugin?.footer_template || ''
        if (footer_template) {
            if (footer_el) {
                let content = fs.readFileSync(footer_template, { encoding: 'utf-8' }).toString()
                const metadata = file_info.markdown_context.metadata
                for (const key in metadata) {
                    if (Object.hasOwnProperty.call(metadata, key)) {
                        if (metadata[key]) {
                            content = content.replace(new RegExp(`{{METADATA.${key}}}`, 'g'), metadata[key])
                        }
                    }
                }
                footer_el.innerHTML = content
            } else {
                console.log('[extra-widget] [WARN] : footer element not found, please add a div with class "footer" in ".markdown-wrapper"')
            }
        }

        // 以下是侧边栏操作
        const sidebar = document.querySelector('.sidebar')
        if (!sidebar) {
            return
        }

        // 添加侧边栏额外链接信息
        const sidebar_extra_el = document.querySelector('.sidebar-wrapper .extra')
        const sidebar_links_group = EWiki.config?.extra_widget_plugin?.sidebar_links_group || []
        if (sidebar_extra_el) {
            for (const group of sidebar_links_group) {
                const group_el = document.createElement('div')
                group_el.setAttribute('class', 'links-group')
                const group_name = document.createElement('div')
                group_name.textContent = group.name
                group_el.append(group_name, document.createElement('hr'))
                sidebar_extra_el.appendChild(group_el)
                addExtraLinks(document, group_el, group.links)
            }
        } else {
            if (sidebar_links_group.length > 0) {
                console.log('[extra-widget] [WARN] : sidebar extra element not found, please add a div with class "extra" in ".sidebar-wrapper"')
            }
        }

        // 添加首页链接
        let base_url = String(EWiki.config.server?.base_url || '')
        base_url = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url

        // 生成各级别父元素
        for (const source of sources) {
            if (source.markdown_context.metadata.sidebar == undefined) {
                continue
            }
            // 去掉 文件名，只要中间部分
            const parts = getFilepathParts(source.filepath).slice(0, -1)
            // 长度为零说明是根目录，则不创建任何元素，跳过到直接创建链接
            if (parts.length === 0) {
                continue
            }

            let root = null
            for (let index = 0; index < parts.length; index++) {
                const part = parts[index];
                if (part.trim() === '') continue
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
            if (source.markdown_context.metadata.sidebar != undefined) {
                const parts = getFilepathParts(source.filepath)
                const parent = [...parts].slice(0, -1).map(p => `[data-folder="${p}"]`).join(' ')
                let container_el;
                // parent 为空则说明是根目录
                if (parent.trim() === '') {
                    container_el = document.querySelector('.sidebar-wrapper .root-folder')
                } else {
                    container_el = sidebar.querySelector(parent)
                }

                if (container_el) {
                    const name = source.markdown_context.metadata.sidebar || [...parts].slice(-1)[0]
                    const a = document.createElement('a')
                    a.textContent = name
                    const href = (base_url || '') + join(source.dest.replace(process.cwd(), '')).replace(/\\/g, '/')
                    a.setAttribute('href', href)

                    container_el.appendChild(a)
                    container_el.setAttribute('open', '')
                }
            }
        }

        fs.writeFile(file_info.dest, jsdom.serialize(), { encoding: 'utf-8' }, (err) => {
            if (err) {
                console.log('[extra-widget] error: ' + err);
            }
        })
    })

}

function addExtraLinks(document, container, links) {
    for (const hl of links) {
        const a = document.createElement('a')
        a.setAttribute('href', hl.href || '')
        a.setAttribute('target', hl.target || '_blank')
        a.setAttribute('style', hl.style || '')
        Object.assign(a, hl.attrs || {})

        if (hl.text) {
            a.textContent = hl.text.trim()
        } else if (hl.html) {
            a.innerHTML = hl.html.trim()
        } else if (hl.img) {
            const img = document.createElement('img')
            img.setAttribute('src', hl.img.src.trim() || '')
            img.setAttribute('style', hl.img.style || '')
            a.appendChild(img)
        } else {
            console.log('[extra-widget] [WARN] : link must have text|html|img property')
        }
        container.appendChild(a)
    }
}

/** @return {string[]} */
function getFilepathParts(filepath) {

    return filepath.replace(process.cwd(), '').replace(/\\/g, '/').split('/').filter(s => s.trim())
}