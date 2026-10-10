// Local equivalent of the GitHub Action's web build: clone/update AI Studio's repo into
// web/, build it, and inject the OTA updater. Then `npx cap sync android` bundles web/dist.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });
if (existsSync('web/.git')) run('git pull --ff-only', 'web');
else run('git clone https://github.com/TenLecks/ApexLift-Google web');
run('npm install --legacy-peer-deps --no-audit --no-fund', 'web');
run('npm run build', 'web');
run('node apk/inject.mjs web/dist');
