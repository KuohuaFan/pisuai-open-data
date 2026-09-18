import "dotenv/config";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import {
  syncGovernmentCatalogDelta,
  syncGovernmentCatalogFile,
} from "../server/governmentCatalog";
import { compareManifestRowCount } from "./catalogSnapshot";
import { downloadCatalogRelease } from "./catalogRelease";

const args = process.argv.slice(2);
const [mode = "full"] = args;

if (mode === "full" && args[1] === "--from-release") {
  const tag = args[2];
  if (!tag)
    throw new Error("full --from-release requires a catalog-YYYY-MM-DD tag");
  const release = await downloadCatalogRelease(tag);
  try {
    const result = await syncGovernmentCatalogFile(release.csvPath, {
      snapshotDate: release.manifest.snapshotDate,
      sha256: release.manifest.sha256,
    });
    compareManifestRowCount(release.manifest.rowCount, result.recordsSeen);
    console.log(
      JSON.stringify(
        { ...result, releaseTag: tag, releaseUrl: release.releaseUrl },
        null,
        2
      )
    );
  } finally {
    await rm(dirname(release.csvPath), { recursive: true, force: true });
  }
} else if (mode === "full") {
  const path = args[1] ?? "/tmp/datagov.csv";
  console.log(JSON.stringify(await syncGovernmentCatalogFile(path), null, 2));
} else if (mode === "delta") {
  const reportDate = args[1];
  if (!reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    throw new Error("delta mode requires YYYY-MM-DD");
  }
  console.log(
    JSON.stringify(await syncGovernmentCatalogDelta(reportDate), null, 2)
  );
} else {
  throw new Error(
    "Usage: syncGovernmentCatalog.ts full <csv-path> | full --from-release <catalog-YYYY-MM-DD> | delta <YYYY-MM-DD>"
  );
}

process.exit(0);
