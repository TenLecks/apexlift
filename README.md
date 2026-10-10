# ApexLift Android

Android APK shell for **ApexLift**. The app's code lives in
[TenLecks/ApexLift-Google](https://github.com/TenLecks/ApexLift-Google) and is edited in Google AI Studio.
Don't edit the app here; AI Studio would overwrite it.

## How updates reach the phone
1. AI Studio pushes to `ApexLift-Google`.
2. `.github/workflows/publish-update.yml` checks it every ~10 min, builds it, and publishes
   `bundle.zip` as a release here. Run the workflow manually to skip the wait.
3. The installed APK (`apk/updater.js` + `@capgo/capacitor-updater`) downloads the latest release
   on launch and switches to it on the next app restart. A broken update rolls back automatically.

## Rebuilding the APK (only for native changes: name, icon, permissions, plugins)
    npm install
    npm run sync
    cd android && ./gradlew assembleDebug

Needs JDK 21 (`JAVA_HOME`) and the Android SDK (`android/local.properties`).
Build on the same machine as before so the new APK installs over the old one (same debug key).
