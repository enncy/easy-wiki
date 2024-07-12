
// @ts-check


const fs = require('fs');
const { resolve } = require('path');

const hljs_github_style = fs.readFileSync(resolve(__dirname, './hljs-github.min.css')).toString('utf-8');
const bootstrap_style = fs.readFileSync(resolve(__dirname, './bootstrap.min.css')).toString('utf-8');
const el = (document, tag, html) => {
	const e = document.createElement(tag)
	e.innerHTML = html
	return e
};


/** @type {import('../../lib/interface.d.ts').Plugin} */
exports.default = {
	onHtmlFileRender(filepath, dest, ctx, { document }) {
		document.head.append(el(document, 'style', hljs_github_style));
		document.head.append(el(document, 'style', bootstrap_style));

		document.querySelectorAll('table').forEach((table) => {
			table.classList.add('table');
		});
	}
}
