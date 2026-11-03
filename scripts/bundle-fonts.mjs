import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/fonts');
await fs.mkdir(target, { recursive: true });
const files = [
  ['dm-sans-regular.ttf', 'https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf'],
  ['dm-sans-medium.ttf', 'https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf'],
  ['dm-sans-semibold.ttf', 'https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAfJthTg.ttf'],
  ['italiana.ttf', 'https://fonts.gstatic.com/s/italiana/v21/QldNNTtLsx4E__B0XTmR.ttf'],
  ['DM-Sans-OFL.txt', 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt'],
  ['Italiana-OFL.txt', 'https://raw.githubusercontent.com/google/fonts/main/ofl/italiana/OFL.txt']
];
for (const [name, source] of files) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(path.join(target, name), bytes);
  console.log(`${name}: ${bytes.length} bytes`);
}
