const fs = require('node:fs');

const reportPath = process.argv[2] ?? 'licenses.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const whitelist = new Set(['MIT', 'Apache-2.0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'MPL-2.0', 'CC0-1.0']);
const forbidden = new Set(['GPL', 'GPL-2.0', 'GPL-3.0', 'AGPL', 'AGPL-3.0', 'LGPL', 'LGPL-2.1', 'LGPL-3.0']);
const violations = [];

for (const [packageName, metadata] of Object.entries(report)) {
  const licenses = String(metadata.licenses ?? 'UNKNOWN')
    .split(/\s+OR\s+|\s+AND\s+|\s*,\s*/)
    .map((license) => license.trim());

  if (licenses.some((license) => forbidden.has(license)) || licenses.includes('UNKNOWN') || !licenses.every((license) => whitelist.has(license))) {
    violations.push(`${packageName}: ${metadata.licenses ?? 'UNKNOWN'}`);
  }
}

if (violations.length > 0) {
  console.error('License audit failed. Non-whitelisted licenses:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`License audit passed: ${Object.keys(report).length} packages checked.`);
