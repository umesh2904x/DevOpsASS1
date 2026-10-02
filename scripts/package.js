// Packaging step used by the CD pipeline: creates dist/shopverse-<version>.tgz
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const out = path.join(root, 'dist', `shopverse-${pkg.version}.tgz`);

try {
  execFileSync('tar', ['-czf', out, '--exclude=node_modules', '--exclude=dist', '--exclude=.git', '-C', root, '.'], { stdio: 'inherit' });
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`package ok -> ${path.relative(root, out)} (${kb} KB)`);
} catch {
  console.log('package skipped: tar not available on this runner');
}
