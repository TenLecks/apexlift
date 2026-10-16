// Runs apk/updater.js in a fake WebView: a fake Capacitor bridge that, like
// @capgo/capacitor-updater on Android, rejects any download without a checksum.
// Usage: node apk/updater.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SHA = '308caf1cfc632abfea63ee22ec63bcac12606334266fb2a5f3d2dc489c7dbfde';
const source = readFileSync(new URL('./updater.js', import.meta.url), 'utf8');

async function runUpdater(release) {
  const store = new Map();
  const calls = [];
  const bridge = {
    nativePromise: async (plugin, method, options) => {
      calls.push({ method, options });
      if (method === 'current') return { bundle: { version: 'builtin' }, native: '1.0' };
      if (method === 'list') return { bundles: [] };
      if (method === 'download') {
        if (!options.checksum) throw new Error('Failed to download from: ' + options.url);
        return { id: 'b1', version: options.version, status: 'success' };
      }
      return {};
    },
  };
  const window = { Capacitor: bridge, location: { protocol: 'https:', hostname: 'localhost' } };
  const context = vm.createContext({
    window,
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    fetch: async () => ({ ok: true, status: 200, json: async () => release }),
    setTimeout,
    Promise,
    JSON,
    Date,
    Error,
  });
  vm.runInContext(source, context);
  await new Promise((r) => setTimeout(r, 50));
  return { calls, log: JSON.parse(store.get('apexlift_updater_log') || '[]') };
}

const asset = { name: 'bundle.zip', browser_download_url: 'https://github.com/x/releases/download/v42/bundle.zip' };
let failed = false;
const check = async (name, fn) => {
  try {
    await fn();
    console.log('✓ ' + name);
  } catch (e) {
    failed = true;
    console.log('✗ ' + name + '\n    ' + e.message);
  }
};

await check('passes the release asset SHA-256 digest as the download checksum', async () => {
  const { calls, log } = await runUpdater({ tag_name: 'v42', body: '', assets: [{ ...asset, digest: 'sha256:' + SHA }] });
  const dl = calls.find((c) => c.method === 'download');
  assert.equal(dl?.options.checksum, SHA);
  assert.ok(calls.some((c) => c.method === 'next'));
  assert.match(log[0], /v42 ready/);
});

await check('falls back to a "bundle-sha256:" line in the release notes', async () => {
  const { calls } = await runUpdater({ tag_name: 'v43', body: 'source: abc\nbundle-sha256: ' + SHA + '\n', assets: [asset] });
  assert.equal(calls.find((c) => c.method === 'download')?.options.checksum, SHA);
});

await check('without any checksum it logs why instead of calling download', async () => {
  const { calls, log } = await runUpdater({ tag_name: 'v44', body: '', assets: [asset] });
  assert.equal(calls.some((c) => c.method === 'download'), false);
  assert.match(log[0], /no checksum/);
});

if (failed) process.exitCode = 1;
