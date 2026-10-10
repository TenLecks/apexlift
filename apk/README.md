# ApexLift APK

The `android/` project is a Capacitor shell around the web app. Web changes reach the
installed APK over the air: pushing to `main` runs `.github/workflows/publish-update.yml`,
which publishes `bundle.zip` as a GitHub Release; `apk/updater.js` downloads it on launch
and applies it on the next app restart.

Only rebuild the APK when native things change (app name, icon, permissions, plugins):

    npm install --legacy-peer-deps
    npm run build && node apk/inject.mjs && npx cap sync android
    cd android && ./gradlew assembleDebug

Needs JDK 21 (`JAVA_HOME`) and the Android SDK (`android/local.properties`).
Install over the old APK only if it was built on the same machine (same debug key).
