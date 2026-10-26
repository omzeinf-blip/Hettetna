// Resolves the "@/..." path alias (tsconfig paths) so tests can import project source directly.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const srcRoot = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = specifier.slice(2);
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, base]) {
      const url = new URL(candidate, srcRoot);
      if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
    }
  }
  // Next.js subpath entry points have no "exports" map; Node's ESM resolver needs the extension.
  if (/^next\/(server|headers|navigation|cache)$/.test(specifier)) {
    return nextResolve(`${specifier}.js`, context);
  }
  return nextResolve(specifier, context);
}
