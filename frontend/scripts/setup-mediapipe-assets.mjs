#!/usr/bin/env node
// Populates public/mediapipe/ with the MediaPipe WASM runtime + hand-landmarker
// model so useHandLandmarker.ts loads them from this dev server instead of an
// external CDN. Fetching those ~20MB assets from cdn.jsdelivr.net /
// storage.googleapis.com at page-load time was stalling on slow/restricted
// networks and leaving the Live Translate UI stuck on "Loading AI Model..."
// forever. These assets are gitignored (frontend/public/mediapipe/) — this
// script is what repopulates them after a fresh clone + npm install.
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

const wasmSrcDir = path.join(frontendRoot, 'node_modules/@mediapipe/tasks-vision/wasm');
const wasmDestDir = path.join(frontendRoot, 'public/mediapipe/wasm');
const taskDest = path.join(frontendRoot, 'public/mediapipe/hand_landmarker.task');

// FilesetResolver.forVisionTasks() is called with no "useModule" flag in
// useHandLandmarker.ts, so it only ever requests the plain or nosimd variant
// (never *_module_internal.*) — see @mediapipe/tasks-vision/vision_bundle.mjs.
const WASM_FILES = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
// The ML pipeline already keeps a copy of this model for landmark extraction —
// reuse it when present so setup doesn't depend on network access.
const LOCAL_MODEL_FALLBACK = path.join(repoRoot, 'ml/scripts/hand_landmarker.task');

function copyWasm() {
  if (!existsSync(wasmSrcDir)) {
    console.warn(
      `[setup-mediapipe-assets] ${wasmSrcDir} not found — run "npm install" in frontend/ first.`,
    );
    return;
  }
  mkdirSync(wasmDestDir, { recursive: true });
  for (const file of WASM_FILES) {
    copyFileSync(path.join(wasmSrcDir, file), path.join(wasmDestDir, file));
  }
  console.log(`[setup-mediapipe-assets] copied ${WASM_FILES.length} WASM files to public/mediapipe/wasm`);
}

async function fetchModel() {
  if (existsSync(taskDest)) {
    console.log('[setup-mediapipe-assets] hand_landmarker.task already present, skipping');
    return;
  }
  mkdirSync(path.dirname(taskDest), { recursive: true });

  if (existsSync(LOCAL_MODEL_FALLBACK)) {
    copyFileSync(LOCAL_MODEL_FALLBACK, taskDest);
    console.log('[setup-mediapipe-assets] copied hand_landmarker.task from ml/scripts/');
    return;
  }

  console.log(`[setup-mediapipe-assets] downloading hand_landmarker.task from ${MODEL_URL} ...`);
  try {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(taskDest, buf);
    console.log('[setup-mediapipe-assets] downloaded hand_landmarker.task');
  } catch (err) {
    console.warn(
      `[setup-mediapipe-assets] could not download hand_landmarker.task (${err.message}).\n` +
        `  Live Translate / Practice won't work until this file exists at:\n  ${taskDest}\n` +
        `  Retry with "npm run setup:mediapipe", or place the file there manually.`,
    );
  }
}

copyWasm();
await fetchModel();
