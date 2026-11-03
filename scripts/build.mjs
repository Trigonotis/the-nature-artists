import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isPublic = process.argv.includes('--public');
const referencePreview = process.argv.includes('--reference-preview');
const out = path.join(root, isPublic ? 'dist-public' : 'dist');
const read = async name => JSON.parse(await fs.readFile(path.join(root, 'content', name), 'utf8'));
const [catalog, images, settings, localization] = await Promise.all(['catalog.json', 'image-manifest.json', 'settings.json', 'localization.json'].map(read));
// Standard public exports use cleared images. Explicit test previews retain reference status.
const stage = path.join(root, isPublic ? '.build-public' : '.build-preview');
await fs.rm(stage, { recursive: true, force: true });
await fs.mkdir(path.join(stage, 'assets', 'images'), { recursive: true });
await fs.cp(path.join(root, 'assets', 'fonts'), path.join(stage, 'assets', 'fonts'), { recursive: true });
const allowed = images.filter(i => !isPublic || referencePreview || i.public_site_ready === true);
for (const image of allowed) {
  const file = path.basename(image.local_file);
  await fs.copyFile(path.join(root, 'assets', 'images', file), path.join(stage, 'assets', 'images', file));
}
const data = {
  ...catalog, settings, localization, preview: !isPublic, testPreview: isPublic && referencePreview,
  images: allowed.map(({ id, work_id, credit, source_page, license_status, license_url, public_site_ready, alt_zh, width, height, local_file }) => ({
    id, work_id, credit, source_page, license_status, license_url, public_site_ready, alt_zh, width, height,
    src: `./assets/images/${path.basename(local_file)}`
  }))
};
await fs.writeFile(path.join(stage, 'data.js'), `window.NATURE_DATA = ${JSON.stringify(data).replace(/</g, '\\u003c')};\n`);
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg']) await fs.copyFile(path.join(root, file), path.join(stage, file));
if (referencePreview) {
  const html = await fs.readFile(path.join(stage, 'index.html'), 'utf8');
  await fs.writeFile(path.join(stage, 'index.html'), html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="robots" content="noindex, nofollow, noarchive">'));
}
await fs.writeFile(path.join(stage, '.nojekyll'), '');
await fs.writeFile(path.join(stage, 'robots.txt'), isPublic && !referencePreview ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n');
await fs.rm(out, { recursive: true, force: true });
await fs.rename(stage, out);
console.log(`${isPublic ? 'Public export' : 'Local preview'} ready: ${out} (${catalog.works.length} works, ${allowed.length} images)`);
if (isPublic && allowed.length < images.length) console.log('Images without confirmed public permission were omitted. Artwork records and source links remain available.');
