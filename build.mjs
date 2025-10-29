// build.mjs — copy children of ROOT into dist/, then obfuscate target JS
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// JS files to obfuscate (relative to repo root)
const TARGETS = [
  "assets/javascript/app.js",
  "assets/javascript/portfolio.js",
];

const SKIP_NAMES = new Set([
  "dist",
  "node_modules",
  ".git",
  "build.mjs",
  "package.json",
  "package-lock.json",
  "obfuscator.config.json"
]);

async function rimraf(p) { await fs.rm(p, { recursive: true, force: true }); }
async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

function shouldSkipPath(absPath) {
  const rel = path.relative(ROOT, absPath);
  if (!rel || rel === ".") return false;
  // skip target JS (we’ll write obfuscated versions later)
  if (TARGETS.includes(rel)) return true;
  // skip anything inside .git or node_modules or dist
  if (rel.startsWith(".git" + path.sep)) return true;
  if (rel.startsWith("node_modules" + path.sep)) return true;
  if (rel.startsWith("dist" + path.sep)) return true;
  return false;
}

async function copyChild(src, dest) {
  // Copy a single file/dir with filtering
  await fs.cp(src, dest, {
    recursive: true,
    force: true,
    filter: (srcPath) => !shouldSkipPath(srcPath)
  });
}

async function copyRootChildren() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const ent of entries) {
    if (SKIP_NAMES.has(ent.name)) continue; // skip top-level stuff we don’t want copied
    const src = path.join(ROOT, ent.name);
    const dest = path.join(DIST, ent.name);
    await copyChild(src, dest);
  }
}

async function obfuscateTargets() {
  const cfg = JSON.parse(await fs.readFile(path.join(ROOT, "obfuscator.config.json"), "utf8"));
  for (const rel of TARGETS) {
    const inFile = path.join(ROOT, rel);
    const outFile = path.join(DIST, rel);
    const code = await fs.readFile(inFile, "utf8");
    const result = JavaScriptObfuscator.obfuscate(code, cfg);
    await ensureDir(path.dirname(outFile));
    await fs.writeFile(outFile, result.getObfuscatedCode(), "utf8");
    console.log(`obfuscated -> ${rel}`);
  }
}

async function main() {
  console.log("clean dist/");
  await rimraf(DIST);
  await ensureDir(DIST);

  console.log("copying root children into dist/…");
  await copyRootChildren();

  console.log("obfuscating target JS…");
  await obfuscateTargets();

  console.log("done. output in dist/");
}

main().catch((e) => { console.error(e); process.exit(1); });
