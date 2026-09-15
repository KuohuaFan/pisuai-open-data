import "dotenv/config";
import { syncGovernmentCatalogDelta, syncGovernmentCatalogFile } from "../server/governmentCatalog";

const [mode = "full", value = "/tmp/datagov.csv"] = process.argv.slice(2);

if (mode === "full") {
  console.log(await syncGovernmentCatalogFile(value));
} else if (mode === "delta") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("delta mode requires YYYY-MM-DD");
  console.log(await syncGovernmentCatalogDelta(value));
} else {
  throw new Error("Usage: syncGovernmentCatalog.ts full <csv-path> | delta <YYYY-MM-DD>");
}

process.exit(0);
