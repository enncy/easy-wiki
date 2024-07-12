

/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
    onMarkdownItInit(markdownIt) {
    },
    onMarkdownCreate(filepath, ctx) { },
    onMarkdownChange(filepath, ctx) { },
    onHtmlFileRender(filepath, ctx, { document }) {
        document.head.append(el(document, 'style', hljs_github_style));
        document.head.append(el(document, 'style', bootstrap_style));
        document.querySelectorAll('table').forEach((table) => {
            table.classList.add('table');
        });
    }
} 
