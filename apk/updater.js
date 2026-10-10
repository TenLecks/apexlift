// Over-the-air updater for the ApexLift APK.
// Injected into dist/index.html at build time (see apk/inject.mjs) so the app source
// itself never has to know about it — AI Studio can overwrite src/ freely.
//
// Flow: confirm the running bundle works -> ask GitHub for the latest release ->
// download its bundle.zip -> queue it; the plugin swaps it in next time the app is
// backgrounded/restarted. A bundle that never reaches notifyAppReady is rolled back.
(function () {
  var C = window.Capacitor;
  // nativePromise only exists inside the APK (native bridge); no-op in a normal browser.
  if (!C || typeof C.nativePromise !== 'function') return;
  var call = function (method, options) {
    return C.nativePromise('CapacitorUpdater', method, options || {});
  };
  var LATEST = 'https://api.github.com/repos/TenLecks/apexlift/releases/latest';

  (async function () {
    try {
      await call('notifyAppReady');
    } catch (e) {
      console.warn('[updater] notifyAppReady failed', e);
    }
    try {
      var res = await fetch(LATEST, { cache: 'no-store' });
      if (!res.ok) return;
      var release = await res.json();
      var version = release.tag_name;
      var asset = (release.assets || []).find(function (a) { return a.name === 'bundle.zip'; });
      if (!version || !asset) return;

      var current = await call('current');
      if (current.bundle && current.bundle.version === version) return;

      var listed = await call('list');
      var bundle = (listed.bundles || []).find(function (b) {
        return b.version === version && b.status === 'success';
      });
      if (!bundle) {
        bundle = await call('download', { url: asset.browser_download_url, version: version });
      }
      await call('next', { id: bundle.id });
      console.info('[updater] ' + version + ' queued; applies on next app restart');
    } catch (e) {
      console.warn('[updater] update check failed', e);
    }
  })();
})();
