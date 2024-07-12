
const fs = require('fs');
const { resolve } = require('path');

const hljs_github_style = fs.readFileSync(resolve(__dirname, './hljs-github.min.css')).toString('utf-8');
const bootstrap_style = fs.readFileSync(resolve(__dirname, './bootstrap.min.css')).toString('utf-8');
const el = (document, tag, html) => {
	const e = document.createElement(tag)
	e.innerHTML = html
	return e
};

exports.default = class CustomStylePlugin {
	onMarkdownItInit(markdownIt) {
	}
	onMarkdownCreate(filepath, ctx) { }
	onMarkdownChange(filepath, ctx) { }
	onHtmlFileRender(filepath, ctx,/** @type {Window} */ { document }) {
		document.head.append(el(document, 'style', hljs_github_style));
		document.head.append(el(document, 'style', bootstrap_style));

		document.querySelectorAll('table').forEach((table) => {
			table.classList.add('table');
		});
	}
}
