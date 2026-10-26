import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = await import("../scripts/safe-dependency-update.mjs");

test("version comparison is numeric, not alphabetical", () => {
  assert.ok(script.compare("15.5.28", "15.5.9") > 0, "15.5.28 is newer than 15.5.9");
  assert.ok(script.compare("0.35.5", "0.34.5") > 0);
  assert.ok(script.compare("0.34.5", "0.35.5") < 0);
  assert.equal(script.compare("19.1.0", "19.1.0"), 0);
  assert.ok(script.compare("v16.0.0", "15.9.9") > 0);
});

test("lockfile scan finds every copy of a package, including nested ones", () => {
  const lock = {
    packages: {
      "": {},
      "node_modules/postcss": { version: "8.5.31" },
      "node_modules/next/node_modules/postcss": { version: "8.4.31" },
      "node_modules/postcss-value-parser": { version: "4.2.0" },
      "node_modules/sharp": { version: "0.34.5" },
    },
  };
  const copies = script.lockCopies(lock, "postcss");
  assert.deepEqual(copies.map((c: { version: string }) => c.version).sort(), ["8.4.31", "8.5.31"]);
  assert.equal(script.lockCopies(lock, "sharp").length, 1);
  assert.equal(script.lockCopies(lock, "nope").length, 0, "similar names are not matched");
});

test("audit summary names the package, path, affected range and a safe fix; majors are flagged", () => {
  const { counts, findings } = script.summariseAudit({
    metadata: { vulnerabilities: { high: 1, critical: 0, moderate: 1 } },
    vulnerabilities: {
      postcss: { name: "postcss", severity: "moderate", range: "<8.5.10", nodes: ["node_modules/next/node_modules/postcss"], fixAvailable: { name: "next", version: "16.0.0", isSemVerMajor: true } },
      sharp: { name: "sharp", severity: "high", range: "<0.35.5", nodes: ["node_modules/sharp"], fixAvailable: { name: "sharp", version: "0.35.5", isSemVerMajor: false } },
    },
  });
  assert.equal(counts.high, 1);
  const postcss = findings.find((f: { name: string }) => f.name === "postcss");
  assert.equal(postcss.major, true, "a Next 16 upgrade is never offered as the safe fix");
  assert.match(postcss.fix, /لا تطبّقه دون مراجعة/);
  assert.deepEqual(postcss.paths, ["node_modules/next/node_modules/postcss"]);
  assert.equal(findings.find((f: { name: string }) => f.name === "sharp").major, false);
});

const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

test("the script refuses Next.js 16 and a dry run changes nothing", () => {
  const refused = spawnSync(process.execPath, ["scripts/safe-dependency-update.mjs", "--next", "16.0.0"], { encoding: "utf8" });
  assert.equal(refused.status, 2);
  assert.match(refused.stdout, /ليس من سلسلة 15\.x/);

  const before = [hash("package.json"), hash("package-lock.json")];
  const dry = spawnSync(process.execPath, ["scripts/safe-dependency-update.mjs", "--dry-run", "--skip-build"], { encoding: "utf8" });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /dry-run/);
  assert.deepEqual([hash("package.json"), hash("package-lock.json")], before);
});

test("the script never uses forbidden npm flags", () => {
  const source = readFileSync("scripts/safe-dependency-update.mjs", "utf8");
  const commands = source.split("\n").filter((line) => /run\("npm"|run\("npx"|\["install"/.test(line)).join("\n");
  assert.doesNotMatch(commands, /--force|audit.{0,6}fix|--legacy-peer-deps/);
  assert.match(source, /isSemVerMajor/);
});

test("postcss override is proposed only when a safe copy already exists in the lockfile (never a guessed version)", () => {
  const root = { path: "node_modules/postcss", version: "8.5.31" };
  const nested = { path: "node_modules/next/node_modules/postcss", version: "8.4.31" };
  assert.deepEqual(script.pickPostcssFix([root, nested], "8.5.23"), { bad: [nested], fix: "8.5.31" });
  assert.equal(script.pickPostcssFix([nested], "8.5.23").fix, null, "no safe copy available: do not invent one");
  assert.equal(script.pickPostcssFix([root], "8.5.23").bad.length, 0, "nothing vulnerable: no override");
  // the advisories cover postcss <= 8.5.22
  assert.equal(script.pickPostcssFix([{ path: "a", version: "8.5.22" }], "8.5.23").bad.length, 1);
  assert.equal(script.pickPostcssFix([{ path: "a", version: "8.5.23" }], "8.5.23").bad.length, 0);
});
