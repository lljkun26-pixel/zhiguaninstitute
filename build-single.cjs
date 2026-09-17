const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = '/Users/luoluojiakun/Desktop/web/web';
const target = path.join(__dirname, 'index.html');
let html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
for (const file of ['style.css', 'typography.css']) {
  const tag = `<link rel="stylesheet" href="${file}">`;
  assert(html.includes(tag), `Missing stylesheet: ${file}`);
  html = html.replace(tag, () => `<style>\n${fs.readFileSync(path.join(source, file), 'utf8')}\n</style>`);
}
for (const file of ['content.js', 'app.js']) {
  const tag = `<script src="${file}"></script>`;
  assert(html.includes(tag), `Missing script: ${file}`);
  const script = fs.readFileSync(path.join(source, file), 'utf8');
  new vm.Script(script);
  html = html.replace(tag, () => `<script>\n${script.replace(/<\/script/gi, '<\\/script')}\n</script>`);
}
const assets = [...new Set(html.match(/assets\/[a-zA-Z0-9_.-]+\.png/g))];
assert.equal(assets.length, 4);
for (const asset of assets) {
  const original = fs.readFileSync(path.join(source, asset));
  const data = 'data:image/png;base64,' + original.toString('base64');
  assert(Buffer.from(data.split(',')[1], 'base64').equals(original));
  html = html.split(asset).join(data);
}
assert(!html.includes('assets/'));
assert(!/<script\s+src=|<link\s+rel="stylesheet"/.test(html));
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
new vm.Script(scripts.join('\n'));
fs.writeFileSync(target, html);
console.log(JSON.stringify({target, embeddedImages: assets.length, inlineScripts: scripts.length, bytes: Buffer.byteLength(html)}, null, 2));
