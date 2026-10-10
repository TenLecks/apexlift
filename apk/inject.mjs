// Run after the web build: copies the OTA updater into the build output and loads it
// from index.html. Usage: node apk/inject.mjs <dist dir>   (default: web/dist)
// Used by both the GitHub Action and local APK builds.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'web/dist';
const tag = '<script src="./updater.js"></script>';
copyFileSync(new URL('./updater.js', import.meta.url), join(dist, 'updater.js'));
const indexPath = join(dist, 'index.html');
const html = readFileSync(indexPath, 'utf8');
if (!html.includes(tag)) {
  writeFileSync(indexPath, html.replace('</head>', `  ${tag}\n  </head>`));
}
