// build.mjs — copy children -> obfuscate target JS -> minify HTML/CSS
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";
import { minify as minifyHtml } from "html-minifier-terser";
import CleanCSS from "clean-css";

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
  "obfuscator.config.json",
  ".github" // keep CI config out of dist
]);

async function rimraf(p) { await fs.rm(p, { recursive: true, force: true }); }
async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

function shouldSkipPath(absPath) {
  const rel = path.relative(ROOT, absPath);
  if (!rel || rel === ".") return false;
  if (TARGETS.includes(rel)) return true;                  // we’ll re-write these
  if (rel.startsWith(".git" + path.sep)) return true;
  if (rel.startsWith("node_modules" + path.sep)) return true;
  if (rel.startsWith("dist" + path.sep)) return true;
  return false;
}

async function copyChild(src, dest) {
  await fs.cp(src, dest, {
    recursive: true,
    force: true,
    filter: (srcPath) => !shouldSkipPath(srcPath)
  });
}

async function copyRootChildren() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const ent of entries) {
    if (SKIP_NAMES.has(ent.name)) continue;
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

// --- Minify helpers ---
async function* walk(dir) {
  for (const d of await fs.readdir(dir, { withFileTypes: true })) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else yield entry;
  }
}

const htmlMinifyOpts = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeOptionalTags: false,
  minifyCSS: true,   // minifies inline CSS inside HTML
  minifyJS: false    // our JS is already obfuscated separately
};

const cssMinifier = new CleanCSS({ level: 2 });

async function minifyDist() {
  let htmlCount = 0, cssCount = 0;
  for await (const file of walk(DIST)) {
    if (file.endsWith(".html")) {
      const src = await fs.readFile(file, "utf8");
      const out = await minifyHtml(src, htmlMinifyOpts);
      await fs.writeFile(file, out, "utf8");
      htmlCount++;
    } else if (file.endsWith(".css")) {
      const src = await fs.readFile(file, "utf8");
      const { styles } = cssMinifier.minify(src);
      await fs.writeFile(file, styles, "utf8");
      cssCount++;
    }
  }
  console.log(`minified -> ${htmlCount} HTML, ${cssCount} CSS`);
}

async function main() {
  console.log("clean dist/");
  await rimraf(DIST);
  await ensureDir(DIST);

  console.log("copying root children into dist/…");
  await copyRootChildren();

  console.log("obfuscating target JS…");
  await obfuscateTargets();

  console.log("minifying HTML/CSS in dist/…");
  await minifyDist();

  console.log("done. output in dist/");
}

main().catch((e) => { console.error(e); process.exit(1); });
