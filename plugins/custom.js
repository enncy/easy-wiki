// @ts-check
 
/** @type {import('../node_modules/ewiki/lib/interface.d.ts').Plugin} */
exports.default = {
    onMarkdownItInit(md) {
        md.core.ruler.push('custom-rule', function (state) {
            const tokens = state.tokens
            function handle(tokens) {
                for (const token of tokens) {
                    addClass(token, 'table', ['table-striped'])
                    addClass(token, 'pre', ['custom'])
                    addClass(token, 'blockquote', ['custom'])
                    if (token.children?.length) {
                        handle(token.children)
                    }
                }
            }
            handle(tokens)
        })
    }
}

function addClass(token, tag_name, list) {
    if (token.tag === tag_name) {
        token.attrSet('class', list.join(' '))
    }
}