#!/usr/bin/env node
// Populates public/reference/ with one short demonstration clip per curriculum
// sign so the Practice screens can show a real reference video instead of the
// "REFERENCE VIDEO UNAVAILABLE" placeholder. The source clips live in the
// training dataset (ml/data/, gitignored) — ~15MB of the 518MB there is enough
// for all 102 signs, so we copy rather than ship the whole dataset. The output
// is gitignored too (frontend/public/reference/); this script is what
// repopulates it after a fresh clone + npm install.
import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

const datasetDir = path.join(repoRoot, 'ml/data/archive/Dataset - MP - VID');
const seedPath = path.join(repoRoot, 'backend/app/data/curriculum_seed.json');
const destDir = path.join(frontendRoot, 'public/reference');

// Keep in sync with referenceClipUrl() in src/services/referenceClips.ts —
// sign ids like "1. one" and "Grand father" have to survive being a URL.
function slugify(signId) {
  return signId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The dataset nests clips as <Category>/<Sign>/<Sign>_001.mp4, and its folder
// names don't always match the seed's capitalisation.
function indexDataset() {
  const byName = new Map();
  for (const category of readdirSync(datasetDir)) {
    const categoryDir = path.join(datasetDir, category);
    if (!statSync(categoryDir).isDirectory()) continue;
    for (const sign of readdirSync(categoryDir)) {
      const signDir = path.join(categoryDir, sign);
      if (statSync(signDir).isDirectory()) byName.set(sign.trim().toLowerCase(), signDir);
    }
  }
  return byName;
}

// Every clip in the dataset is H.264, but some sit in .mov containers that not
// every browser will play — prefer an .mp4 sibling, of which each sign has many.
function pickClip(signDir) {
  const clips = readdirSync(signDir)
    .filter((file) => file.toLowerCase().endsWith('.mp4'))
    .sort();
  return clips.length ? path.join(signDir, clips[0]) : null;
}

if (!existsSync(datasetDir)) {
  console.warn(
    `[setup-reference-clips] dataset not found at:\n  ${datasetDir}\n` +
      '  Practice will fall back to the "reference unavailable" placeholder.',
  );
  process.exit(0);
}
if (!existsSync(seedPath)) {
  console.warn(`[setup-reference-clips] curriculum seed not found at ${seedPath}, skipping`);
  process.exit(0);
}

const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
const signIds = (seed.signs ?? []).map((sign) => sign.sign_id);
const dataset = indexDataset();

mkdirSync(destDir, { recursive: true });

let copied = 0;
let bytes = 0;
const unmatched = [];

for (const signId of signIds) {
  const signDir = dataset.get(signId.trim().toLowerCase());
  const source = signDir ? pickClip(signDir) : null;
  if (!source) {
    unmatched.push(signId);
    continue;
  }
  const dest = path.join(destDir, `${slugify(signId)}.mp4`);
  copyFileSync(source, dest);
  copied += 1;
  bytes += statSync(dest).size;
}

console.log(
  `[setup-reference-clips] copied ${copied}/${signIds.length} clips ` +
    `(${(bytes / 1e6).toFixed(1)}MB) to public/reference`,
);
if (unmatched.length) {
  console.warn(`[setup-reference-clips] no clip found for: ${unmatched.join(', ')}`);
}
