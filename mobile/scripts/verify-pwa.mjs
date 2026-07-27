import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDirectory = resolve(projectRoot, 'dist');

async function read(relativePath) {
  return readFile(resolve(distDirectory, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const [indexHtml, manifestText, serviceWorker] = await Promise.all([
  read('index.html'),
  read('manifest.json'),
  read('sw.js'),
]);
const manifest = JSON.parse(manifestText);

assert(indexHtml.includes('rel="manifest"'), 'index.html does not link the PWA manifest.');
assert(
  indexHtml.includes('rel="apple-touch-icon"'),
  'index.html does not link the iPhone Home Screen icon.'
);
assert(
  indexHtml.includes(".register('./sw.js')"),
  'index.html does not register the service worker.'
);
assert(manifest.name === 'SpeedRead', 'The PWA manifest has the wrong app name.');
assert(manifest.display === 'standalone', 'The PWA must launch in standalone mode.');
assert(
  manifest.start_url === './',
  'The PWA must start relative to its hosting scope.'
);
assert(
  manifest.scope === './',
  'The PWA scope must follow the directory where it is hosted.'
);
assert(
  Array.isArray(manifest.icons) && manifest.icons.length >= 2,
  'The PWA manifest must provide install icons.'
);

for (const icon of manifest.icons) {
  await access(resolve(distDirectory, icon.src.replace(/^\.?\//, '')));
}

await access(resolve(distDirectory, 'apple-touch-icon.png'));
assert(
  serviceWorker.includes("'speedread-pwa-'"),
  'The generated service worker has no versioned SpeedRead cache.'
);
assert(
  serviceWorker.includes('./index.html') && serviceWorker.includes('/_expo/'),
  'The generated service worker does not precache the app shell and Expo bundle.'
);

console.log('PWA verification passed: manifest, icons, app shell, and offline cache are present.');
