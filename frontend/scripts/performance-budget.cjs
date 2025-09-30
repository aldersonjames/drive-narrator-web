#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '..', 'dist', 'assets');

const budgets = {
  js: 512 * 1024, // 512 KB
  css: 160 * 1024, // 160 KB
};

const totals = { js: 0, css: 0 };

if (!fs.existsSync(distDir)) {
  console.error('Missing dist/assets directory – run `npm run build` before performance checks.');
  process.exit(1);
}

const files = fs.readdirSync(distDir);

for (const file of files) {
  const filePath = path.join(distDir, file);
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) continue;
  if (file.endsWith('.js')) {
    totals.js += stat.size;
  }
  if (file.endsWith('.css')) {
    totals.css += stat.size;
  }
}

const violations = Object.entries(budgets)
  .filter(([key, limit]) => totals[key] > limit)
  .map(([key, limit]) => `${key.toUpperCase()} bundle ${totals[key]} bytes exceeds ${limit} bytes`);

if (violations.length) {
  console.error('Performance budget check failed:');
  violations.forEach((message) => console.error(` - ${message}`));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      jsBytes: totals.js,
      cssBytes: totals.css,
      budgets,
    },
    null,
    2,
  ),
);
