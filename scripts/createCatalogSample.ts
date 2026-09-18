import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse } from "csv-parse";

const [csvPath, outputPath, limitText = "100"] = process.argv.slice(2);
if (!csvPath || !outputPath) {
  throw new Error(
    "Usage: createCatalogSample.ts <csv-path> <output-csv> [limit]"
  );
}
const limit = Number(limitText);
if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
  throw new Error("limit must be between 1 and 1000");

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const records: Record<string, string>[] = [];
const parser = createReadStream(resolve(csvPath)).pipe(
  parse({
    bom: true,
    columns: true,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
  })
);
for await (const raw of parser) {
  records.push(raw as Record<string, string>);
  if (records.length >= limit) break;
}
if (records.length !== limit) {
  throw new Error(`Expected ${limit} records, parsed ${records.length}`);
}
const columns = Object.keys(records[0] ?? {});
if (!columns.includes("資料集識別碼")) {
  throw new Error("Official dataset identifier column was not found");
}
const csv = [
  columns.map(escapeCsv).join(","),
  ...records.map(record =>
    columns.map(column => escapeCsv(record[column])).join(",")
  ),
].join("\n");
await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), `${csv}\n`, "utf8");
console.log(`Wrote ${records.length} sample records to ${resolve(outputPath)}`);
