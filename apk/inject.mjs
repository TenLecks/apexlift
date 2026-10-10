// Run after `vite build`: copies the OTA updater into dist/ and loads it from index.html.
// Used by both the GitHub Action and local APK builds.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const tag = '<script src="./updater.js"></script>';
copyFileSync('apk/updater.js', 'dist/updater.js');
const html = readFileSync('dist/index.html', 'utf8');
if (!html.includes(tag)) {
  writeFileSync('dist/index.html', html.replace('</head>', `  ${tag}\n  </head>`));
}
