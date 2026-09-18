import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { catalogReleaseManifestSchema } from "./catalogRelease";
import { verifySnapshotChecksum } from "./catalogSnapshot";

const [archivePath, checksumPath, manifestPath] = process.argv.slice(2);
if (!archivePath || !checksumPath || !manifestPath) {
  throw new Error(
    "Usage: verifyCatalogReleaseAssets.ts <snapshot.csv.gz> <snapshot.sha256> <manifest.json>"
  );
}

const manifest = catalogReleaseManifestSchema.parse(
  JSON.parse(await readFile(resolve(manifestPath), "utf8"))
);
const sha256 = await verifySnapshotChecksum(
  resolve(archivePath),
  resolve(checksumPath)
);
if (sha256 !== manifest.sha256)
  throw new Error("Manifest SHA-256 does not match the release asset");

console.log(JSON.stringify(manifest, null, 2));
