import { once } from "node:events";
import { createReadStream, createWriteStream, type WriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { finished } from "node:stream/promises";
import { parse } from "csv-parse";
import {
  CATALOG_OFFICIAL_COLUMN_COUNT,
  CATALOG_STRIPPED_FIELDS,
} from "../shared/attribution";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function writeCsvRow(stream: WriteStream, values: unknown[]) {
  const line = `${values.map(escapeCsv).join(",")}\n`;
  if (!stream.write(line, "utf8")) await once(stream, "drain");
}

export function assertOfficialCatalogColumns(columns: string[]) {
  if (columns.length !== CATALOG_OFFICIAL_COLUMN_COUNT) {
    throw new Error(
      `Expected ${CATALOG_OFFICIAL_COLUMN_COUNT} official catalog columns, received ${columns.length}`
    );
  }
  for (const field of CATALOG_STRIPPED_FIELDS) {
    if (!columns.includes(field)) {
      throw new Error(`Required contact field was not found: ${field}`);
    }
  }
}

export async function sanitizeCatalogCsv(
  inputPath: string,
  outputPath: string
) {
  const input = resolve(inputPath);
  const output = resolve(outputPath);
  if (input === output) {
    throw new Error("Input and output CSV paths must be different");
  }

  await mkdir(dirname(output), { recursive: true });
  const parser = createReadStream(input).pipe(
    parse({
      bom: true,
      relax_quotes: true,
      skip_empty_lines: true,
    })
  );
  const writer = createWriteStream(output, { encoding: "utf8" });
  let columns: string[] | null = null;
  let strippedIndexes: number[] = [];
  let rowCount = 0;
  const clearedValues = Object.fromEntries(
    CATALOG_STRIPPED_FIELDS.map(field => [field, 0])
  ) as Record<(typeof CATALOG_STRIPPED_FIELDS)[number], number>;

  try {
    for await (const raw of parser) {
      const row = (raw as unknown[]).map(value => String(value ?? ""));
      if (!columns) {
        columns = row;
        assertOfficialCatalogColumns(columns);
        strippedIndexes = CATALOG_STRIPPED_FIELDS.map(field =>
          columns!.indexOf(field)
        );
        await writeCsvRow(writer, columns);
        continue;
      }
      if (row.length !== columns.length) {
        throw new Error(
          `Catalog row ${rowCount + 1} has ${row.length} columns; expected ${columns.length}`
        );
      }
      for (const [position, index] of strippedIndexes.entries()) {
        if (row[index].trim())
          clearedValues[CATALOG_STRIPPED_FIELDS[position]] += 1;
        row[index] = "";
      }
      await writeCsvRow(writer, row);
      rowCount += 1;
    }
    if (!columns || rowCount === 0) {
      throw new Error("Catalog CSV did not contain a header and data rows");
    }
    writer.end();
    await finished(writer);
  } catch (error) {
    writer.destroy();
    throw error;
  }

  return {
    rowCount,
    columnCount: columns.length,
    strippedFields: [...CATALOG_STRIPPED_FIELDS],
    clearedValues,
  };
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    throw new Error("Usage: sanitizeCatalogCsv.ts <input-csv> <output-csv>");
  }
  console.log(
    JSON.stringify(await sanitizeCatalogCsv(inputPath, outputPath), null, 2)
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === resolve(new URL(import.meta.url).pathname)) {
  await main();
}
