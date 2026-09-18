import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CatalogIndexManifest } from "./buildCatalogIndex";

export function updatePagesCatalogMetadata(
  html: string,
  manifest: CatalogIndexManifest
) {
  const total = manifest.totalDatasets.toLocaleString("en-US");
  const agencies = manifest.agencyCount.toLocaleString("en-US");
  const rules: Array<[RegExp, string, number]> = [
    [/(<strong data-catalog-total>)[^<]+(<\/strong\s*>)/g, `$1${total}$2`, 2],
    [
      /(<strong data-catalog-agencies>)[^<]+(<\/strong\s*>)/g,
      `$1${agencies}$2`,
      1,
    ],
    [
      /(<div class="registry-stamp" data-catalog-snapshot>)[^<]+(<\/div>)/g,
      `$1${manifest.snapshotDate} snapshot$2`,
      1,
    ],
  ];

  let updated = html;
  for (const [pattern, replacement, expectedCount] of rules) {
    const matches = updated.match(pattern)?.length ?? 0;
    if (matches !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} matches for ${pattern}, received ${matches}`
      );
    }
    updated = updated.replace(pattern, replacement);
  }
  return updated;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === resolve(new URL(import.meta.url).pathname)) {
  const [htmlPath, manifestPath] = process.argv.slice(2);
  if (!htmlPath || !manifestPath) {
    throw new Error(
      "Usage: updatePagesCatalogMetadata.ts <site-index.html> <catalog-manifest.json>"
    );
  }
  const manifest = JSON.parse(
    await readFile(resolve(manifestPath), "utf8")
  ) as CatalogIndexManifest;
  const updated = updatePagesCatalogMetadata(
    await readFile(resolve(htmlPath), "utf8"),
    manifest
  );
  await writeFile(resolve(htmlPath), updated, "utf8");
}
