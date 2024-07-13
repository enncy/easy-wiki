
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



/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
    onMarkdownItInit(md) {
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