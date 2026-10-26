#!/usr/bin/env node
/**
 * Safe, reversible dependency security update for HETTETNA (Next.js 15.x line).
 *
 *   node scripts/safe-dependency-update.mjs [options]
 *
 * Options
 *   --next <version>        Next.js version to install            (default 15.5.28; must stay on 15.x)
 *   --sharp <version>       Minimum sharp version Next must use   (default 0.35.5)
 *   --postcss-min <version> Minimum safe postcss in EVERY copy     (default 8.5.23; advisories cover <=8.5.22)
 *   --dry-run               Print what would run; change nothing
 *   --skip-build            Skip `npm run build`
 *   --restore-on-failure    Put the backed-up package.json / package-lock.json back if a step fails
 *
 * It never runs `npm audit fix`, never uses --force, and refuses Next.js 16.
 * Every run writes a timestamped backup and a Markdown report to .dependency-backup/<timestamp>/.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const argv = process.argv.slice(2);
const has = (name) => argv.includes(name);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};

export const options = {
  next: opt("--next", "15.5.28"),
  sharp: opt("--sharp", "0.35.5"),
  postcssMin: opt("--postcss-min", "8.5.23"),
  dryRun: has("--dry-run"),
  skipBuild: has("--skip-build"),
  restoreOnFailure: has("--restore-on-failure"),
};
const ROOT = process.cwd();

// ----------------------------------------------------------------------------- helpers
const parse = (v) => String(v).replace(/^[^\d]*/, "").split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
export function compare(a, b) {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}
const readJson = (file) => JSON.parse(readFileSync(join(ROOT, file), "utf8"));
const log = (message = "") => console.log(message);

function run(command, args, { capture = false } = {}) {
  const shown = `${command} ${args.join(" ")}`;
  if (options.dryRun) {
    log(`  [dry-run] ${shown}`);
    return { status: 0, stdout: "", stderr: "" };
  }
  log(`  $ ${shown}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32", // npm/npx are .cmd files on Windows
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    maxBuffer: 128 * 1024 * 1024,
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** Every installed copy of a package recorded in package-lock.json: [{ path, version }]. */
export function lockCopies(lock, name) {
  return Object.entries(lock.packages ?? {})
    .filter(([path]) => path === `node_modules/${name}` || path.endsWith(`/node_modules/${name}`))
    .map(([path, value]) => ({ path, version: value.version }));
}

export function snapshot(lock) {
  const names = ["next", "eslint-config-next", "react", "react-dom", "sharp", "postcss", "@tailwindcss/postcss"];
  return Object.fromEntries(names.map((name) => [name, lockCopies(lock, name)]));
}

/**
 * Decides whether postcss needs a scoped override. A fix is only proposed when a safe copy ALREADY
 * exists in the lockfile (e.g. the one Tailwind uses), so the override never points at a version
 * that has not been resolved and tested.
 */
export function pickPostcssFix(copies, min) {
  const bad = copies.filter((c) => compare(c.version, min) < 0);
  const safe = copies.filter((c) => compare(c.version, min) >= 0).sort((a, b) => compare(b.version, a.version));
  return { bad, fix: bad.length && safe.length ? safe[0].version : null };
}

const fmt = (copies) => (copies.length ? copies.map((c) => `${c.version} (${c.path.replace(/node_modules\//g, "")})`).join(", ") : "—");

/** Locates <name>/package.json even when the package defines an "exports" map without it. */
function packageJsonOf(req, name) {
  try {
    return req.resolve(`${name}/package.json`);
  } catch {
    let dir = dirname(req.resolve(name));
    for (let i = 0; i < 8; i++, dir = dirname(dir)) {
      const candidate = join(dir, "package.json");
      if (existsSync(candidate) && JSON.parse(readFileSync(candidate, "utf8")).name === name) return candidate;
    }
    throw new Error(`cannot locate ${name}`);
  }
}

/** The sharp version Next.js will actually load: resolved from next's own location, like Node does. */
export function sharpUsedByNext() {
  try {
    const nextJson = packageJsonOf(createRequire(join(ROOT, "package.json")), "next");
    const resolved = packageJsonOf(createRequire(nextJson), "sharp");
    return { path: resolved, version: JSON.parse(readFileSync(resolved, "utf8")).version };
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------- audit parsing
export function summariseAudit(json) {
  const counts = json?.metadata?.vulnerabilities ?? {};
  const findings = Object.values(json?.vulnerabilities ?? {}).map((v) => {
    const fix = v.fixAvailable;
    const fixText =
      fix === true ? "إصلاح متاح ضمن الإصدارات الحالية (npm install)"
      : fix && typeof fix === "object"
        ? fix.isSemVerMajor
          ? `يتطلب تحديثًا رئيسيًا إلى ${fix.name}@${fix.version} — لا تطبّقه دون مراجعة`
          : `تحديث ${fix.name} إلى ${fix.version}`
        : "لا يوجد إصلاح متاح حاليًا";
    return { name: v.name, severity: v.severity, range: v.range, paths: v.nodes ?? [], fix: fixText, major: Boolean(fix && typeof fix === "object" && fix.isSemVerMajor) };
  });
  return { counts, findings };
}

// ----------------------------------------------------------------------------- main
export async function main() {
  const startedAt = new Date();
  const stamp = startedAt.toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  const backupDir = join(ROOT, ".dependency-backup", stamp);
  const results = [];
  const record = (name, status, note = "") => results.push({ name, ok: status === 0, status, note });
  let restoreNeeded = false;

  log(`\nHETTETNA — تحديث آمن للاعتماديات${options.dryRun ? " (تجربة بدون تنفيذ)" : ""}\n`);

  // ---- 0. guards
  if (parse(options.next)[0] !== 15) {
    log(`✖ مرفوض: الإصدار ${options.next} ليس من سلسلة 15.x. هذا السكربت يبقي المشروع على Next.js 15.`);
    process.exit(2);
  }
  for (const file of ["package.json", "package-lock.json"]) {
    if (!existsSync(join(ROOT, file))) {
      log(`✖ الملف ${file} غير موجود. شغّل السكربت من جذر المشروع.`);
      process.exit(2);
    }
  }

  // ---- 1. before
  const before = snapshot(readJson("package-lock.json"));
  log("1) الإصدارات قبل التحديث (من package-lock.json):");
  for (const [name, copies] of Object.entries(before)) log(`   ${name.padEnd(22)} ${fmt(copies)}`);

  // ---- 2. backup
  log(`\n2) نسخة احتياطية قابلة للرجوع ← ${backupDir}`);
  if (!options.dryRun) {
    mkdirSync(backupDir, { recursive: true });
    for (const file of ["package.json", "package-lock.json"]) copyFileSync(join(ROOT, file), join(backupDir, file));
    writeFileSync(join(backupDir, "versions-before.json"), JSON.stringify(before, null, 2));
  }

  const restore = () => {
    log("\n↩ استعادة النسخة الاحتياطية...");
    for (const file of ["package.json", "package-lock.json"]) copyFileSync(join(backupDir, file), join(ROOT, file));
    run("npm", ["ci"]);
  };
  const failStep = (name, status) => {
    record(name, status);
    if (status !== 0) restoreNeeded = true;
  };

  // ---- 3. controlled install (no --force, no audit fix)
  log(`\n3) تثبيت Next.js ${options.next} مع eslint-config-next وReact 19.1.x (ثبات تام للأرقام):`);
  const install = run("npm", [
    "install", "--save-exact", "--no-fund",
    `next@${options.next}`, `eslint-config-next@${options.next}`, "react@19.1", "react-dom@19.1",
  ]);
  failStep("تثبيت next + eslint-config-next + react", install.status);
  if (install.status !== 0) {
    log("\n✖ فشل التثبيت. إن كانت الرسالة ETARGET فالإصدار المطلوب غير موجود؛ اعرض المتاح بالأمر:");
    log("    npm view next@15 version");
    return finish();
  }

  // ---- 4. sharp: make sure the copy Next really loads is new enough
  log(`\n4) التحقق من sharp الذي يستخدمه Next.js فعلًا (المطلوب ≥ ${options.sharp}):`);
  let used = options.dryRun ? null : sharpUsedByNext();
  if (used) log(`   Next يحمّل sharp ${used.version}  ←  ${used.path}`);
  if (!options.dryRun && used && compare(used.version, options.sharp) < 0) {
    log(`   نطاق Next لـ sharp لا يسمح بـ${options.sharp}، فأضيف override واحدًا ومحددًا لـ sharp فقط.`);
    const pkg = readJson("package.json");
    pkg.overrides = { ...(pkg.overrides ?? {}), sharp: options.sharp };
    writeFileSync(join(ROOT, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
    const again = run("npm", ["install", "--no-fund"]);
    failStep("تثبيت sharp عبر override", again.status);
    used = sharpUsedByNext();
    if (used) log(`   بعد الـ override: Next يحمّل sharp ${used.version}`);
  } else if (options.dryRun) {
    log("   [dry-run] سيُقارن إصدار sharp المحمّل بالمطلوب، ويضيف override لـ sharp فقط عند الحاجة.");
  }
  if (!options.dryRun) {
    const ok = used && compare(used.version, options.sharp) >= 0;
    record(`sharp المستخدم من Next ≥ ${options.sharp}`, ok ? 0 : 1, used ? `الفعلي: ${used.version}` : "sharp غير مثبّت");
    if (!ok) restoreNeeded = true;
  }

  // ---- 5. postcss: scoped override ONLY if a vulnerable copy remains after the Next update
  log(`\n5) postcss (المطلوب: كل النسخ ≥ ${options.postcssMin}):`);
  if (options.dryRun) {
    log("   [dry-run] سيفحص نسخ postcss في القفل، ويضيف override مقيّدًا بـ next فقط إذا بقيت نسخة قديمة وتوفرت نسخة سليمة في القفل.");
  } else {
    let { bad, fix } = pickPostcssFix(lockCopies(readJson("package-lock.json"), "postcss"), options.postcssMin);
    if (!bad.length) {
      log("   كل نسخ postcss سليمة بعد تحديث Next؛ لا حاجة لأي override.");
    } else if (fix) {
      log(`   بقيت نسخة قديمة: ${fmt(bad)}. أضيف override مقيّدًا بـ next إلى النسخة الموجودة أصلًا في القفل (${fix}).`);
      const pkg = readJson("package.json");
      const current = pkg.overrides?.next;
      pkg.overrides = { ...(pkg.overrides ?? {}), next: { ...(current && typeof current === "object" ? current : {}), postcss: fix } };
      writeFileSync(join(ROOT, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
      failStep("تثبيت postcss عبر override مقيّد بـ next", run("npm", ["install", "--no-fund"]).status);
      ({ bad } = pickPostcssFix(lockCopies(readJson("package-lock.json"), "postcss"), options.postcssMin));
    } else {
      log("   لا توجد نسخة سليمة جاهزة في القفل لتُستخدم؛ لن أخمّن رقمًا. أرسل تقرير audit لتحديد الحل.");
    }
    record(`postcss: كل النسخ ≥ ${options.postcssMin}`, bad.length ? 1 : 0, bad.length ? `المتبقي: ${fmt(bad)}` : "");
    if (bad.length) restoreNeeded = false; // report it; do not roll back a working update over this
  }
  run("npm", ["ls", "postcss", "--all"]);

  // ---- 6. audit
  log("\n6) npm audit:");
  const audit = run("npm", ["audit", "--json"], { capture: true });
  let auditSummary = { counts: {}, findings: [] };
  if (!options.dryRun) {
    try {
      auditSummary = summariseAudit(JSON.parse(audit.stdout));
      log(`   الملخص: ${JSON.stringify(auditSummary.counts)}`);
      for (const f of auditSummary.findings) {
        log(`   • ${f.name} [${f.severity}] المتأثر: ${f.range}`);
        for (const p of f.paths) log(`       المسار: ${p}`);
        log(`       الحل: ${f.fix}`);
      }
    } catch {
      log("   تعذّر قراءة نتيجة audit (تحقق من الاتصال بسجل npm).");
      record("npm audit", 1, "تعذّر الحصول على نتيجة");
    }
  }
  const blocking = (auditSummary.counts.critical ?? 0) + (auditSummary.counts.high ?? 0);
  if (!options.dryRun) record("npm audit بلا Critical/High", blocking === 0 ? 0 : 1, `critical=${auditSummary.counts.critical ?? "?"}, high=${auditSummary.counts.high ?? "?"}`);

  // ---- 7. verification (all steps run so you see every result)
  log("\n7) الفحوصات:");
  const lsResult = run("npm", ["ls", "next", "react", "react-dom", "sharp", "postcss"]);
  record("npm ls (سلامة الشجرة)", lsResult.status);
  const checks = [
    ["TypeScript", "npx", ["tsc", "--noEmit"]],
    ["Lint", "npm", ["run", "lint"]],
    ["الاختبارات الآلية", "npm", ["test"]],
    ...(options.skipBuild ? [] : [["Production build", "npm", ["run", "build"]]]),
  ];
  for (const [name, cmd, args] of checks) {
    const r = run(cmd, args);
    record(name, r.status);
    if (r.status !== 0 && (name === "TypeScript" || name === "Production build")) restoreNeeded = true;
  }

  return finish();

  // ---- 8. report
  function finish() {
    const after = options.dryRun ? before : snapshot(readJson("package-lock.json"));
    const lines = [
      "# تقرير تحديث الاعتماديات",
      "",
      `- التاريخ: ${startedAt.toISOString()}`,
      `- النسخة الاحتياطية: \`${backupDir}\``,
      "",
      "## الإصدارات",
      "",
      "| الحزمة | قبل | بعد |",
      "|---|---|---|",
      ...Object.keys(before).map((n) => `| ${n} | ${fmt(before[n])} | ${fmt(after[n])} |`),
      "",
      "## نتائج الفحوصات",
      "",
      "| الفحص | النتيجة | ملاحظة |",
      "|---|---|---|",
      ...results.map((r) => `| ${r.name} | ${r.ok ? "نجح" : "فشل"} | ${r.note} |`),
      "",
      "## الثغرات المتبقية",
      "",
      ...(auditSummary.findings.length
        ? auditSummary.findings.map((f) => `- **${f.name}** [${f.severity}] المتأثر: \`${f.range}\` — المسارات: ${f.paths.join("، ") || "—"} — الحل: ${f.fix}`)
        : ["لا شيء مسجّل (أو لم يُنفَّذ audit)."]),
      "",
      "## الرجوع للنسخة السابقة",
      "",
      `انسخ \`package.json\` و\`package-lock.json\` من \`${backupDir}\` فوق الحاليين، ثم شغّل \`npm ci\`.`,
    ];
    if (!options.dryRun) {
      mkdirSync(backupDir, { recursive: true });
      writeFileSync(join(backupDir, "dependency-update-report.md"), `${lines.join("\n")}\n`);
    }

    log("\n=== الخلاصة ===");
    for (const r of results) log(`  ${r.ok ? "✔" : "✖"} ${r.name}${r.note ? ` — ${r.note}` : ""}`);
    if (!options.dryRun) log(`\nالتقرير الكامل: ${join(backupDir, "dependency-update-report.md")}`);

    const failed = results.some((r) => !r.ok);
    if (failed && restoreNeeded && !options.dryRun) {
      if (options.restoreOnFailure) restore();
      else log(`\nلإرجاع كل شيء كما كان: انسخ الملفين من ${backupDir} ثم شغّل npm ci (أو أعد التشغيل مع --restore-on-failure).`);
    }
    process.exitCode = failed ? 1 : 0;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("safe-dependency-update.mjs")) {
  main();
}
