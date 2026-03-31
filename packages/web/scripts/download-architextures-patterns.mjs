#!/usr/bin/env node
/**
 * Downloads pattern SVGs from Architextures CDN and saves them locally.
 * Also creates a mapping file from hash → pattern type.
 *
 * Usage:  node scripts/download-architextures-patterns.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'packages/web/public/patterns');

// Only keep the supported pattern set used in the Create UI.
const PATTERN_MAP = {
  '1d5305e7': 'running_bond',
  '0bcf2061': 'stack_bond',
  '1fa27e77': 'stretcher_bond',
  '3fad62dd': 'flemish_bond',
  '1ea4157e': 'herringbone',
  '7defa857': 'chevron',
  '2f0a69d': 'staggered',
  '3d8cc05f': 'ashlar',
  '4da513b2': 'cubic',
  '2e533750': 'hexagonal',
  '2bc445de': 'basketweave',
  '1b437a3f': 'hopscotch',
  '0debddc5': 'diamond',
  '4edbdbfb': 'intersecting_circle',
  '1ed0852a': 'fishscale',
  '3b5896d2': 'french',
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const seenTypes = new Set();
  const results = [];
  const errors = [];

  // Deduplicate: we want one file per pattern type
  const typeToHash = {};
  for (const [hash, type] of Object.entries(PATTERN_MAP)) {
    if (!typeToHash[type]) {
      typeToHash[type] = hash;
    }
  }

  for (const [type, hash] of Object.entries(typeToHash)) {
    const url = `https://assets.architextures.org/patterns/${hash}.svg`;
    const outPath = path.join(OUT_DIR, `${type}.svg`);

    try {
      console.log(`Downloading ${type} (${hash})...`);
      const svg = await fetch(url);
      
      if (!svg.includes('<svg') && !svg.includes('<SVG')) {
        console.log(`  ⚠ ${type}: not valid SVG, skipping`);
        errors.push({ type, hash, error: 'not valid SVG' });
        continue;
      }
      
      await fs.writeFile(outPath, svg, 'utf8');
      results.push({ type, hash, file: `${type}.svg` });
      console.log(`  ✓ ${type}.svg`);
    } catch (err) {
      console.log(`  ✗ ${type}: ${err.message}`);
      errors.push({ type, hash, error: err.message });
    }
  }

  console.log(`\nDone: ${results.length} downloaded, ${errors.length} errors`);
  
  if (errors.length) {
    console.log('\nErrors:');
    for (const e of errors) {
      console.log(`  ${e.type} (${e.hash}): ${e.error}`);
    }
  }

  // Write mapping file
  const mapping = {};
  for (const r of results) {
    mapping[r.type] = r.file;
  }
  const mapPath = path.join(OUT_DIR, '_pattern-map.json');
  await fs.writeFile(mapPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\nMapping written to ${path.relative(ROOT, mapPath)}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
