#!/usr/bin/env node
// gen-image — generate a raster image from Claude Code (or any shell) through Google Antigravity's
// image model (`generate_image`), using the user's own Antigravity CLI (`agy`) in headless mode.
// Inside Antigravity itself, call the `generate_image` tool directly instead of this script.
//
// Usage:
//   node gen-image.mjs --out assets/hero.jpg --aspect 16:9 --prompt "top-down flat lay of a V60 on linen, morning light, no text"
//   node gen-image.mjs --out brand/concept-1.png --prompt-file prompt.txt
//   node gen-image.mjs --check            (only reports whether agy is available; generates nothing)
// Options: --aspect W:H (default 1:1; e.g. 1:1 4:5 9:16 16:9 4:3 3:2) · --timeout <seconds> 10..900 (default 240)
// Finds agy via $AGY_PATH, ~/.gemini/bin/agy(.exe), then PATH. Runs in a throwaway temp folder so the
// project is never touched; the prompt is passed as a single argv element (no shell).
// Prints JSON { ok, out, source, seconds }. Exit: 0 ok · 1 generation failed · 2 usage error / agy missing.
// Uses the user's Antigravity quota — generate only what the task needs.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const USAGE = 'Usage: node gen-image.mjs --out <file.png|jpg> (--prompt "<description>" | --prompt-file <file>) [--aspect 16:9] [--timeout 240] | --check';

// Returns { opts } or { error }. readFile is injectable for tests.
export function parseArgs(argv, readFile = (p) => readFileSync(p, 'utf8')) {
  const value = (name) => {
    const i = argv.indexOf(`--${name}`);
    if (i < 0) return undefined;
    const v = argv[i + 1];
    return v === undefined || v.startsWith('--') ? '' : v;
  };
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  if (argv.includes('--check')) return { opts: { check: true } };
  const out = value('out');
  const promptFile = value('prompt-file');
  let prompt = value('prompt');
  if (promptFile !== undefined) {
    if (!promptFile) return { error: '--prompt-file needs a path' };
    if (!existsSync(promptFile)) return { error: `Prompt file not found: ${promptFile}` };
    prompt = readFile(promptFile).trim();
  }
  if (!out) return { error: USAGE };
  if (!prompt || !prompt.trim()) return { error: USAGE };
  if (!/\.(png|jpe?g|webp)$/i.test(out)) return { error: `--out must end in .png, .jpg, .jpeg or .webp: ${out}` };
  const aspect = value('aspect') ?? '1:1';
  const m = aspect.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m || Number(m[1]) === 0 || Number(m[2]) === 0) return { error: `Invalid --aspect "${aspect}" (expected W:H, e.g. 4:5)` };
  const timeoutRaw = value('timeout') ?? '240';
  const timeout = Number(timeoutRaw);
  if (!Number.isInteger(timeout) || timeout < 10 || timeout > 900) return { error: `Invalid --timeout "${timeoutRaw}" (whole seconds, 10..900)` };
  return { opts: { out, prompt: prompt.trim(), aspect, timeout } };
}

export function findAgy(env = process.env, home = homedir(), probe = probePath) {
  const candidates = [env.AGY_PATH, join(home, '.gemini', 'bin', process.platform === 'win32' ? 'agy.exe' : 'agy')].filter(Boolean);
  return candidates.find((p) => existsSync(p)) || probe();
}

function probePath() {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['agy'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() || null : null;
}

export function buildInstruction(prompt, aspect) {
  return [
    'Use the generate_image tool to create exactly one image.',
    `Aspect ratio: ${aspect}.`,
    `Image description: ${prompt}`,
    'Do not run shell commands and do not create or edit files.',
    'When done, reply with ONLY the absolute path of the generated image file and nothing else.',
  ].join('\n');
}

// Parses agy's stdout (JSON or raw text). Returns { status, response, source }.
export function extractImagePath(stdout) {
  let response = stdout || '';
  let status = null;
  try {
    const parsed = JSON.parse(response);
    status = parsed.status || null;
    response = String(parsed.response || '');
  } catch {
    /* not JSON — search the raw text */
  }
  const match = response.match(/([A-Za-z]:\\[^\r\n"]+?\.(?:png|jpe?g|webp))|(\/[^\r\n"]+?\.(?:png|jpe?g|webp))/i);
  return { status, response, source: match ? match[1] || match[2] : null };
}

// Keeps the real format: if --out asks for another extension, the source's extension wins.
export function resolveOut(outArg, source) {
  const out = resolve(outArg);
  const srcExt = extname(source).toLowerCase();
  const outExt = extname(out).toLowerCase();
  const jpeg = ['.jpg', '.jpeg'];
  if (outExt === srcExt || (jpeg.includes(srcExt) && jpeg.includes(outExt))) return out;
  return out.slice(0, out.length - outExt.length) + srcExt;
}

function main() {
  const fail = (code, message, extra = {}) => {
    console.log(JSON.stringify({ ok: false, error: message, ...extra }));
    process.exit(code);
  };
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 14).join('\n'));
    process.exit(0);
  }
  if (parsed.error) fail(2, parsed.error);
  const agy = findAgy();
  if (!agy) fail(2, 'Antigravity CLI (agy) not found. Install Antigravity or set AGY_PATH; otherwise use the SVG/HTML route (brand-logo, brand-social-templates) or write the prompt pack for the user.');
  if (parsed.opts.check) {
    console.log(JSON.stringify({ ok: true, agy }));
    process.exit(0);
  }
  const { out: outArg, prompt, aspect, timeout } = parsed.opts;
  const work = mkdtempSync(join(tmpdir(), 'perfect-gen-image-'));
  const started = Date.now();
  const run = spawnSync(agy, ['-p', buildInstruction(prompt, aspect), '--print-timeout', `${timeout}s`, '--output-format', 'json'], {
    cwd: work,
    encoding: 'utf8',
    timeout: (timeout + 60) * 1000,
    maxBuffer: 16 * 1024 * 1024,
  });
  rmSync(work, { recursive: true, force: true });
  const seconds = Math.round((Date.now() - started) / 1000);
  if (run.error) fail(1, `agy failed to run: ${run.error.message}`, { seconds });
  const { status, response, source } = extractImagePath(run.stdout);
  if (status && status !== 'SUCCESS') fail(1, `agy status ${status}`, { seconds, response: response.slice(0, 500) });
  if (!source || !existsSync(source)) fail(1, 'No generated image path in the agy response', { seconds, response: response.slice(0, 500), stderr: (run.stderr || '').slice(-500) });
  const out = resolveOut(outArg, source);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(source, out);
  console.log(JSON.stringify({ ok: true, out, source, seconds }));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) main();
