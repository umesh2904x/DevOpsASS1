'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'dist');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const routes = fs
  .readdirSync(path.join(root, 'server', 'src'), { recursive: true })
  .filter((f) => String(f).endsWith('.js'))
  .map((f) => 'server/src/' + String(f).replace(/\\/g, '/'));

fs.mkdirSync(outDir, { recursive: true });

const manifest = {
  name: pkg.name,
  version: pkg.version,
  node: process.version,
  buildId: process.env.GITHUB_RUN_ID || 'local',
  builtAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  modules: routes.sort()
};

fs.writeFileSync(path.join(outDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('build ok ->', path.relative(root, path.join(outDir, 'build-manifest.json')), `(${routes.length} modules)`);
