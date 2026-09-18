import { resolve } from "node:path";
import { createCatalogSnapshotAssets } from "./catalogSnapshot";

const [inputPath, snapshotDate, outputDir, generatorCommit] =
  process.argv.slice(2);

if (!inputPath || !snapshotDate || !outputDir || !generatorCommit) {
  throw new Error(
    "Usage: createCatalogSnapshot.ts <csv-path> <YYYY-MM-DD> <output-dir> <generator-commit>"
  );
}

const result = await createCatalogSnapshotAssets(
  resolve(inputPath),
  snapshotDate,
  resolve(outputDir),
  generatorCommit
);

console.log(JSON.stringify(result.manifest, null, 2));
