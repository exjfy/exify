// build.mjs — copies your site to dist/ and swaps in obfuscated JS
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

async function rimraf(p) {
  await fs.rm(p, { recursive: true, force: true });
}
async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyEverythingExceptTargets() {
  // copy the whole repo into dist/ while skipping stuff we don't want
  await fs.cp(ROOT, DIST, {
    recursive: true,
    force: true,
    filter: (srcPath) => {
      // skip build output and node bits
      if (srcPath === DIST) return false;
      if (srcPath.includes(`${path.sep}dist${path.sep}`)) return false;
      if (srcPath.endsWith(`${path.sep}dist`)) return false;
      if (srcPath.includes(`${path.sep}node_modules${path.sep}`)) return false;
      if (srcPath.endsWith(`${path.sep}node_modules`)) return false;

      // skip git internals (but keep .github for actions)
      if (srcPath.includes(`${path.sep}.git${path.sep}`)) return false;
      if (srcPath.endsWith(`${path.sep}.git`)) return false;

      // skip top-level build files themselves
      const base = path.basename(srcPath);
      if (["build.mjs", "package.json", "package-lock.json", "obfuscator.config.json"].includes(base)) return false;

      // skip the JS files we will replace with obfuscated versions
      const rel = path.relative(ROOT, srcPath);
      if (TARGETS.includes(rel)) return false;

      return true;
    },
  });
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

  console.log("copying site (minus target JS)...");
  await copyEverythingExceptTargets();

  console.log("obfuscating target JS...");
  await obfuscateTargets();

  console.log("done. output in dist/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
