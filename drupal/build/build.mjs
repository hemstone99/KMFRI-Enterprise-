/**
 * Builds the static assets shipped with the Drupal module (run from the repo root):
 *
 *   node drupal/build/build.mjs
 *
 * 1. data/catalogue.json — the service catalogue exported from src/data/serviceCatalogue.ts,
 *                         plus the catalogue images copied from public/images.
 * 2. images/icons.svg — SVG sprite of every icon the templates use (Lucide + brand marks).
 * 3. css/hub.css      — the design system (src/index.css + drupal/build/drupal.css),
 *                       compiled by Tailwind against the module templates, PHP and JS.
 *
 * All outputs are committed, so a Drupal site needs no Node toolchain.
 */
import fs from 'node:fs';
import path from 'node:path';
import { compile, optimize } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { exportCatalogue } from './catalogue.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const moduleDir = path.join(root, 'drupal/modules/kmfri_enterprise');
const lucideDir = path.join(root, 'node_modules/lucide-react/dist/esm/icons');

const walk = (dir, exts) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p, exts);
    return exts.includes(path.extname(e.name)) ? [p] : [];
  });

/* ------------------------------------------------------------------ */
/* 0. Service catalogue                                                */
/* ------------------------------------------------------------------ */
await exportCatalogue(root, moduleDir);

/* ------------------------------------------------------------------ */
/* 1. Icon sprite                                                      */
/* ------------------------------------------------------------------ */
const BRAND = {
  'brand-facebook': 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  'brand-x': 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  'brand-youtube': 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  'brand-whatsapp': 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z',
  'brand-linkedin': 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
};

const names = new Set();
// Names passed to kmfri_icon() must resolve; the other patterns are best-effort.
const explicit = new Set();
const sources = walk(moduleDir, ['.twig', '.php', '.yml']);
for (const file of sources) {
  const text = fs.readFileSync(file, 'utf8');
  // Any quoted name inside a kmfri_icon(...) call (covers ternaries).
  for (const call of text.matchAll(/kmfri_icon\(([^)]*)\)/g)) {
    // Ignore values that are only compared against (s.dir == 'asc' ? ...).
    const args = call[1].replace(/[=!]=\s*'[^']*'/g, '');
    for (const m of args.matchAll(/'([a-z0-9-]+)'/g)) {
      names.add(m[1]);
      explicit.add(m[1]);
    }
  }
  // Icon names in data files (icon: x) and PHP/Twig maps ('key' => 'icon', key: 'icon').
  for (const m of text.matchAll(/\bicon:\s*['"]?([a-z0-9-]+)/g)) names.add(m[1]);
  for (const m of text.matchAll(/=>\s*'([a-z0-9-]+)'/g)) names.add(m[1]);
  for (const m of text.matchAll(/^\s*[a-z_-]+:\s*'([a-z0-9-]+)',?$/gm)) names.add(m[1]);
  for (const m of text.matchAll(/'[a-z-]+':\s*'([a-z0-9-]+)'/g)) names.add(m[1]);
  // Names handed to macros or PHP arrays (kd.kpi(..., 'trending-up'), ['inbox', ...]):
  // keep any quoted kebab-case token that is a real Lucide icon.
  for (const m of text.matchAll(/'([a-z][a-z0-9]*(?:-[a-z0-9]+)+|[a-z]+)'/g)) {
    if (fs.existsSync(path.join(lucideDir, `${m[1]}.js`))) names.add(m[1]);
  }
}

const symbols = [];
const missing = [];
for (const name of [...names].sort()) {
  if (BRAND[name]) {
    symbols.push(`<symbol id="i-${name}" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="${BRAND[name]}"/></symbol>`);
    continue;
  }
  const file = path.join(lucideDir, `${name}.js`);
  if (!fs.existsSync(file)) {
    missing.push(name);
    continue;
  }
  const nodeRe = /const __iconNode = (\[[\s\S]*?\]);\r?\n/;
  let src = fs.readFileSync(file, 'utf8');
  let node = src.match(nodeRe);
  // Aliases re-export another icon module.
  for (let hop = 0; !node && hop < 3; hop++) {
    const target = src.match(/from '\.\/([a-z0-9-]+)\.js'/);
    if (!target) break;
    src = fs.readFileSync(path.join(lucideDir, `${target[1]}.js`), 'utf8');
    node = src.match(nodeRe);
  }
  if (!node) {
    missing.push(name);
    continue;
  }
  const parts = Function(`return ${node[1]}`)();
  const body = parts
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('');
  symbols.push(`<symbol id="i-${name}" viewBox="0 0 24 24">${body}</symbol>`);
}
// Second kmfri_icon() arguments are CSS classes, so only flag names that look like icons.
const unresolved = missing.filter((n) => explicit.has(n) && !/^(chev|transition-transform)$/.test(n));
fs.writeFileSync(
  path.join(moduleDir, 'images/icons.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`
);
console.log(`icons.svg: ${symbols.length} symbols`);
if (unresolved.length) throw new Error(`Unknown icons: ${unresolved.join(', ')}`);

/* ------------------------------------------------------------------ */
/* 2. Stylesheet                                                       */
/* ------------------------------------------------------------------ */
const design = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
const additions = ['drupal.css', 'dashboard.css']
  .map((f) => fs.readFileSync(path.join(root, 'drupal/build', f), 'utf8'))
  .join('\n');
if (!design.startsWith('@import "tailwindcss";')) throw new Error('src/index.css must start with @import "tailwindcss";');
// Only the Drupal sources decide which utilities are generated.
const input = design.replace('@import "tailwindcss";', '@import "tailwindcss" source(none);') + '\n' + additions;

const compiler = await compile(input, { base: root, onDependency: () => {} });
const scanner = new Scanner({
  sources: [
    { base: moduleDir, pattern: '**/*.{twig,php,js,yml}', negated: false },
    { base: path.join(root, 'drupal/themes/kmfri_hub'), pattern: '**/*.{twig,theme}', negated: false },
  ],
});
const css = compiler.build(scanner.scan());
const { code } = optimize(css, { minify: true });
fs.mkdirSync(path.join(moduleDir, 'css'), { recursive: true });
fs.writeFileSync(path.join(moduleDir, 'css/hub.css'), code);
console.log(`hub.css: ${(code.length / 1024).toFixed(1)} KB`);
