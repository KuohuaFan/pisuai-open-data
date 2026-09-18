import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseCatalogIndexCsv } from "./buildCatalogIndex";

const [csvPath, outputPath, limitText = "100"] = process.argv.slice(2);
if (!csvPath || !outputPath) {
  throw new Error(
    "Usage: createCatalogSample.ts <csv-path> <output-json> [limit]"
  );
}
const limit = Number(limitText);
if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
  throw new Error("limit must be between 1 and 1000");

const records = (await parseCatalogIndexCsv(resolve(csvPath))).slice(0, limit);
await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(
  resolve(outputPath),
  `${JSON.stringify(records, null, 2)}\n`,
  "utf8"
);
console.log(`Wrote ${records.length} sample records to ${resolve(outputPath)}`);
