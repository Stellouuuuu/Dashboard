#!/usr/bin/env node
/**
 * Builds the React app and packs CSS + JS + promo images into one HTML file
 * that works offline (fonts still load from CDN when online).
 * Uses HashRouter for file:// / double-click opens.
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const appTsx = join(root, 'src', 'App.tsx');
const outPath = join(root, 'Threshold-standalone.html');

const original = readFileSync(appTsx, 'utf8');
const patched = original
  .replace(/BrowserRouter/g, 'HashRouter')
  .replace(
    "from 'react-router-dom';",
    "from 'react-router-dom';\n/* HashRouter injected for standalone HTML */",
  );

if (!original.includes('BrowserRouter')) {
  console.error('App.tsx: BrowserRouter not found — aborting');
  process.exit(1);
}

writeFileSync(appTsx, patched);

try {
  console.log('Building with HashRouter…');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
} finally {
  writeFileSync(appTsx, original);
  console.log('Restored App.tsx (BrowserRouter)');
}

const distHtml = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
const cssMatch = distHtml.match(/href="(\/assets\/[^"]+\.css)"/);
const jsMatch = distHtml.match(/src="(\/assets\/[^"]+\.js)"/);
if (!cssMatch || !jsMatch) {
  console.error('Could not find built CSS/JS in dist/index.html');
  process.exit(1);
}

let css = readFileSync(join(root, 'dist', cssMatch[1].slice(1)), 'utf8');
let js = readFileSync(join(root, 'dist', jsMatch[1].slice(1)), 'utf8');

function dataUri(filePath, mime) {
  const buf = readFileSync(filePath);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

const assets = {
  '/promo/promo-dashboard-widgets.png': dataUri(
    join(root, 'public', 'promo', 'promo-dashboard-widgets.png'),
    'image/png',
  ),
  '/promo/promo-portal-cta.png': dataUri(
    join(root, 'public', 'promo', 'promo-portal-cta.png'),
    'image/png',
  ),
  '/favicon.svg': dataUri(join(root, 'public', 'favicon.svg'), 'image/svg+xml'),
};

for (const [path, uri] of Object.entries(assets)) {
  js = js.split(path).join(uri);
  css = css.split(path).join(uri);
}

const themeScript = `(function(){try{var s=localStorage.getItem('threshold-theme');var t=s==='light'||s==='dark'?s:'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Threshold — dashboard</title>
<link rel="icon" type="image/svg+xml" href="${assets['/favicon.svg']}"/>
<link rel="preconnect" href="https://api.fontshare.com"/>
<link rel="preconnect" href="https://cdn.fontshare.com" crossorigin/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=satoshi@300,400,500,700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<script>${themeScript}</script>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script type="module">${js}</script>
</body>
</html>
`;

writeFileSync(outPath, html);
const sizeMb = (Buffer.byteLength(html) / (1024 * 1024)).toFixed(2);
console.log(`Wrote ${outPath} (${sizeMb} MB)`);
console.log('Open the file in a browser (double-click). Routes use #/… (ex: #/login).');
console.log('Demo admin: stella@epitech.eu / password123');
