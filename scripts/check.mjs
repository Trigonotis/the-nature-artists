import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = async name => JSON.parse(await fs.readFile(path.join(root, 'content', name), 'utf8'));
const [catalog, images, settings, localization] = await Promise.all(['catalog.json', 'image-manifest.json', 'settings.json', 'localization.json'].map(json));
const unique = (items, label) => assert.equal(new Set(items.map(i => i.id)).size, items.length, `Duplicate ${label} IDs`);
unique(catalog.works, 'artwork'); unique(catalog.artists, 'artist'); unique(images, 'image'); unique(catalog.sources, 'source');
for (const work of catalog.works) {
  assert(catalog.artists.some(a => a.id === work.artist_id), `Missing artist for ${work.id}`);
  assert(settings.order.includes(work.id), `Missing display order for ${work.id}`);
  assert(settings.topics.some(t => t.works.includes(work.id)), `Missing topic for ${work.id}`);
  for (const source of work.source_ids) assert(catalog.sources.some(s => s.id === source), `Missing source ${source}`);
  for (const id of work.image_ids) assert(images.some(i => i.id === id), `Missing image ${id}`);
  assert(work.title_en && work.title_zh && work.summary_en && work.summary_zh, `Incomplete bilingual description for ${work.id}`);
  if (/[\u4e00-\u9fff]/.test(work.year)) assert(localization[work.id]?.year_en, `Missing English date for ${work.id}`);
}
for (const image of images) {
  assert(image.credit && image.source_page && image.alt_zh, `Incomplete image metadata: ${image.id}`);
  const file = path.join(root, 'assets', 'images', path.basename(image.local_file));
  assert((await fs.stat(file)).size > 0, `Empty image ${image.id}`);
}
for (const script of ['app.js', 'dist/data.js']) new vm.Script(await fs.readFile(path.join(root, script), 'utf8'), { filename: script });
const html = await fs.readFile(path.join(root, 'dist', 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) await fs.access(path.join(root, 'dist', match[1]));
const css = await fs.readFile(path.join(root, 'dist', 'styles.css'), 'utf8');
assert(!/@import\s+url\(['"]?https?:/.test(css), 'External stylesheet dependency');
for (const match of css.matchAll(/url\('\.\/([^']+)'\)/g)) await fs.access(path.join(root, 'dist', match[1]));
console.log(`PASS: ${catalog.works.length} bilingual works, ${catalog.artists.length} artists, ${catalog.sources.length} sources, ${images.length} local images.`);
console.log('PASS: content relationships, script syntax, built assets, and local fonts.');
