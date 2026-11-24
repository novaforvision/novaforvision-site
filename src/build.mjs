// Génère le site : pages HTML (FR et EN), assets/nova.css, assets/nova.js.
// Usage : npm run build   (node src/build.mjs)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { pages, sitemap } from './pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 8);

// 1. Script : un seul fichier, minifié
const js = await esbuild.build({
  entryPoints: [join(ROOT, 'src/js/main.js')], bundle: true, minify: true, format: 'iife',
  target: ['es2020', 'safari15'], write: false, legalComments: 'none',
  banner: { js: '/* NOVA FOR VISION · GSAP (MIT, GreenSock) */' },
});
const jsCode = js.outputFiles[0].text;
writeFileSync(join(ROOT, 'assets/nova.js'), jsCode);

// 2. Styles : minifiés par esbuild
const css = await esbuild.transform(readFileSync(join(ROOT, 'src/css/nova.css'), 'utf8'), { loader: 'css', minify: true, target: ['chrome110', 'safari15.4', 'firefox115'] });
const cssCode = css.code;
writeFileSync(join(ROOT, 'assets/nova.css'), cssCode);

const V = { css: hash(cssCode), js: hash(jsCode) };

// 3. Pages
let n = 0;
for (const p of pages(V)) {
  const out = join(ROOT, p.path, p.path.endsWith('.html') ? '' : 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, p.html);
  n++;
}
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap(new Date().toISOString().slice(0, 10)));
console.log(`ok : ${n} pages, nova.css ${(cssCode.length / 1024).toFixed(1)} Ko, nova.js ${(jsCode.length / 1024).toFixed(1)} Ko (v ${V.css}/${V.js})`);
