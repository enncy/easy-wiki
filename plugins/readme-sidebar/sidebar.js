
// @ts-check

const fs = require('fs');

const files = {}
/** @type {Document  } */
// @ts-ignore
let ctx_doc = undefined
let readme_path = ''

const el = (document, tag, html) => {
    const e = document.createElement(tag)
    e.innerHTML = html
    return e
};

/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
    onHtmlFileRender(filepath, dest, ctx, { document }) {
        if (ctx.is_readme_file) {
            ctx_doc = document
            readme_path = dest
        }
        files[dest.replace(process.cwd(), '').replace(/\\/g, '/').split('/').join('/')] = ctx
    },
    onRenderFinish() {
        if (ctx_doc) {
            const jsdom = new EWiki.JSDOM(ctx_doc.documentElement.outerHTML)
            jsdom.window.document.body.append(el(ctx_doc, 'script', `window.__ewiki_sidebar_info__=${JSON.stringify(files)}`))
            fs.writeFileSync(readme_path, jsdom.serialize())
        }
    }
}  