// Patches Windows backslash paths baked into the server bundle during a Windows build.
// react-router-serve reads assetsBuildDirectory from the bundle and uses path.join on Linux,
// where backslashes are not separators — causing express.static to point to a non-existent path.
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

const bundlePath = join(__dirname, '..', 'build', 'server', 'index.js');

if (!existsSync(bundlePath)) {
  console.log('[fix-win-paths] Server bundle not found, skipping');
  process.exit(0);
}

const content = readFileSync(bundlePath, 'utf8');
const fixed = content.replace(/build\\\\client/g, 'build/client');

if (content !== fixed) {
  writeFileSync(bundlePath, fixed);
  console.log('[fix-win-paths] Patched Windows paths in server bundle');
} else {
  console.log('[fix-win-paths] Paths already correct, no changes needed');
}
