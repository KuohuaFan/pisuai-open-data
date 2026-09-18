import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  compareManifestRowCount,
  createCatalogSnapshotAssets,
  inspectCatalogCsv,
  verifySnapshotChecksum,
} from "../scripts/catalogSnapshot";
import { catalogReleaseManifestSchema } from "../scripts/catalogRelease";

const SAMPLE = [
  '"資料集識別碼","資料集名稱","服務分類","提供機關","授權方式","更新頻率"',
  '"1","資料甲","公共資訊","機關甲","政府資料開放授權條款-第1版","每日"',
  '"2","資料乙","交通及通訊","機關乙","CC0","每月"',
].join("\n");

describe("catalog snapshot assets", () => {
  it("validates rows and unique dataset IDs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisuods-snapshot-"));
    const csv = join(dir, "catalog.csv");
    await writeFile(csv, `${SAMPLE}\n`, "utf8");
    await expect(inspectCatalogCsv(csv)).resolves.toEqual({
      rowCount: 2,
      uniqueDatasetIds: 2,
    });
  });

  it("creates a reproducible manifest and rejects a tampered checksum", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pisuods-snapshot-"));
    const csv = join(dir, "catalog.csv");
    const out = join(dir, "out");
    await writeFile(csv, `${SAMPLE}\n`, "utf8");
    const result = await createCatalogSnapshotAssets(
      csv,
      "2026-09-15",
      out,
      "0123456789abcdef"
    );

    expect(result.manifest).toMatchObject({
      snapshotDate: "2026-09-15",
      rowCount: 2,
      uniqueDatasetIds: 2,
      publisher: "評律數位科技股份有限公司",
    });
    expect(catalogReleaseManifestSchema.parse(result.manifest)).toEqual(
      result.manifest
    );
    await expect(
      verifySnapshotChecksum(result.assetPath, result.checksumPath)
    ).resolves.toBe(result.manifest.sha256);

    await writeFile(result.assetPath, "tampered", "utf8");
    await expect(
      verifySnapshotChecksum(result.assetPath, result.checksumPath)
    ).rejects.toThrow("SHA-256 mismatch");
    expect(JSON.parse(await readFile(result.manifestPath, "utf8"))).toEqual(
      result.manifest
    );
  });

  it("warns when a release manifest count differs from imported rows", () => {
    const warn = vi.fn();
    expect(compareManifestRowCount(2, 1, warn)).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    expect(compareManifestRowCount(2, 2, warn)).toBe(true);
  });
});
