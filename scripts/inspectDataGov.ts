import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

const input = process.argv[2] ?? "/tmp/datagov.csv";
const counts = {
  records: 0,
  ids: new Set<string>(),
  providers: new Set<string>(),
  categories: new Map<string, number>(),
  licenses: new Map<string, number>(),
};
let first: Record<string, string> | undefined;

const parser = createReadStream(input).pipe(parse({ bom: true, columns: true, relax_quotes: true, relax_column_count: true }));
for await (const row of parser) {
  const item = row as Record<string, string>;
  first ??= item;
  counts.records += 1;
  if (item["資料集識別碼"]) counts.ids.add(String(item["資料集識別碼"]));
  if (item["提供機關"]) counts.providers.add(item["提供機關"]);
  const category = item["服務分類"] || "未分類";
  counts.categories.set(category, (counts.categories.get(category) ?? 0) + 1);
  const license = item["授權方式"] || "未明示";
  counts.licenses.set(license, (counts.licenses.get(license) ?? 0) + 1);
}

console.log(JSON.stringify({
  records: counts.records,
  uniqueIds: counts.ids.size,
  providers: counts.providers.size,
  fields: Object.keys(first ?? {}),
  first,
  categories: [...counts.categories.entries()].sort((a, b) => b[1] - a[1]),
  licenses: [...counts.licenses.entries()].sort((a, b) => b[1] - a[1]),
}, null, 2));
