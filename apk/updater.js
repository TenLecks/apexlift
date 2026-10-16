// Over-the-air updater for the ApexLift APK.
// Injected into dist/index.html at build time (see apk/inject.mjs) so the app source
// itself never has to know about it — AI Studio can overwrite src/ freely.
//
// Flow: confirm the running bundle works -> ask GitHub for the latest release ->
// download its bundle.zip -> queue it; the plugin swaps it in next time the app is
// backgrounded/restarted. A bundle that never reaches notifyAppReady is rolled back.
//
// Every step is written to localStorage 'apexlift_updater_log' (newest first, max 30)
// so the app's More → App updates screen can show where an update gets stuck.
(function () {
  var LOG_KEY = 'apexlift_updater_log';
  var LATEST = 'https://api.github.com/repos/TenLecks/apexlift/releases/latest';
  var STEP_TIMEOUT_MS = 30000;

  function log(msg) {
    try {
      var list = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      list.unshift(new Date().toISOString() + ' ' + msg);
      localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, 30)));
    } catch (e) {
      /* storage unavailable: nothing else to do */
    }
  }
  function errText(e) {
    if (!e) return 'unknown error';
    return (e.code ? e.code + ': ' : '') + (e.message || e.errorMessage || JSON.stringify(e));
  }
  function withTimeout(p, label) {
    return Promise.race([
      p,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error(label + ' timed out after ' + STEP_TIMEOUT_MS / 1000 + 's'));
        }, STEP_TIMEOUT_MS);
      }),
    ]);
  }

  // The native bridge is normally present before page scripts run; wait briefly in case it is late.
  function waitForBridge(tries) {
    var C = window.Capacitor;
    if (C && typeof C.nativePromise === 'function') return Promise.resolve(C);
    if (tries <= 0) return Promise.resolve(null);
    return new Promise(function (r) {
      setTimeout(r, 100);
    }).then(function () {
      return waitForBridge(tries - 1);
    });
  }

  waitForBridge(30).then(async function (C) {
    if (!C) {
      log('skip: no Capacitor native bridge (not running inside the APK?)');
      return;
    }
    var call = function (method, options) {
      return withTimeout(C.nativePromise('CapacitorUpdater', method, options || {}), method);
    };

    try {
      await call('notifyAppReady');
      log('notifyAppReady ok');
    } catch (e) {
      log('notifyAppReady failed: ' + errText(e));
    }
    try {
      var current = await call('current');
      var running = current && current.bundle ? current.bundle.version : '?';
      log('running bundle: ' + running + ' (native ' + (current && current.native) + ')');

      var res = await withTimeout(fetch(LATEST, { cache: 'no-store' }), 'GitHub request');
      if (!res.ok) {
        log('GitHub answered ' + res.status + ' — will retry next launch');
        return;
      }
      var release = await res.json();
      var version = release.tag_name;
      var asset = (release.assets || []).find(function (a) {
        return a.name === 'bundle.zip';
      });
      if (!version || !asset) {
        log('latest release has no bundle.zip');
        return;
      }
      if (running === version) {
        log('up to date (' + version + ')');
        return;
      }

      var listed = await call('list');
      var bundle = (listed.bundles || []).find(function (b) {
        return b.version === version && b.status === 'success';
      });
      if (!bundle) {
        log('downloading ' + version + ' …');
        bundle = await withTimeout(
          C.nativePromise('CapacitorUpdater', 'download', { url: asset.browser_download_url, version: version }),
          'download'
        );
        log('downloaded ' + version + ' (status ' + bundle.status + ')');
      }
      await call('next', { id: bundle.id });
      log(version + ' ready — close and reopen the app to apply');
    } catch (e) {
      log('update check failed: ' + errText(e));
    }
  });
})();
