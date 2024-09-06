
// @ts-check
const fs = require('fs');
const container = require('markdown-it-container');
const { resolve } = require('path');

const style = fs.readFileSync(resolve(__dirname, './style.css')).toString('utf-8');

const el = (document, tag, html) => {
    const e = document.createElement(tag)
    e.innerHTML = html
    return e
};



/** @type {import('../../lib/src/interface.d.ts').Plugin} */
exports.default = {
    onMarkdownItInit(md) {
        // 添加自定义样式
        md.core.ruler.push('custom-rule', function (state) {
            const tokens = state.tokens
            function handle(tokens) {
                for (const token of tokens) {
                    addClass(token, 'table', ['table-striped', 'custom'])
                    addClass(token, 'pre', ['custom'])
                    addClass(token, 'blockquote', ['custom'])
                    if (token.children?.length) {
                        handle(token.children)
                    }
                }
            }
            handle(tokens)
        })


        // https://www.npmjs.com/package/markdown-it-container
        // @ts-ignore
        customContainer(md, 'success')
        // @ts-ignore
        customContainer(md, 'info')
        // @ts-ignore
        customContainer(md, 'warn')
        // @ts-ignore
        customContainer(md, 'error')
    },
    // @ts-ignore
    onHtmlFileRender(filepath, dest, ctx, { document }) {
        document.head.append(el(document, 'style', style));
    }
}

function addClass(token, tag_name, list) {
    if (token.tag === tag_name) {
        token.attrSet('class', list.join(' '))
    }
}

function customContainer(

    /** @type {import('../../node_modules/markdown-it')} */
    md, name) {
    const reg = RegExp(`^${name}\\s*(.*)`)
    md.use(container, name, {
        validate: function (params) {
            return params.trim().match(reg);
        },
        render: function (tokens, idx) {
            var m = tokens[idx].info.trim().match(reg);
            if (tokens[idx].nesting === 1) {
                // opening tag
                return `<div class="container-${name}">` + (m[1] ? md.render(m[1]) : '');
            } else {
                // closing tag
                return '</div>\n';
            }
        }
    });
} 