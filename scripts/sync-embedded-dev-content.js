#!/usr/bin/env node
/**
 * Old name kept so existing notes and habits still work: the embedded copy now covers both built-in
 * campaigns and is maintained by scripts/sync-embedded-content.js (same flags: --check).
 */
const impl = require('./sync-embedded-content.js');
if (require.main === module) {
  process.argv[1] = require.resolve('./sync-embedded-content.js');
  require('child_process').execFileSync(process.execPath, [require.resolve('./sync-embedded-content.js'), ...process.argv.slice(2)], { stdio: 'inherit' });
}
module.exports = impl;
