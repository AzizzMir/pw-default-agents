import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export default async function globalTeardown() {
  const firefoxHome = process.env.PLAYWRIGHT_FIREFOX_HOME;
  if (!firefoxHome) {
    return;
  }

  const resolvedHome = path.resolve(firefoxHome);
  if (
    path.dirname(resolvedHome) !== path.resolve(os.tmpdir()) ||
    !path.basename(resolvedHome).startsWith('playwright-firefox-home-')
  ) {
    throw new Error(`Refusing to remove unexpected Firefox temporary home: ${resolvedHome}`);
  }

  execFileSync('chmod', ['-RN', resolvedHome]);
  fs.rmSync(resolvedHome, { recursive: true, force: true });
}
