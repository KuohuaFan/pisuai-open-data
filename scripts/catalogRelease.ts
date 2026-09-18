import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { z } from "zod";
import {
  CATALOG_LICENSE_URL,
  CATALOG_SOURCE_URL,
  CATALOG_STRIPPED_FIELDS,
} from "../shared/attribution";
import { verifySnapshotChecksum } from "./catalogSnapshot";

const DEFAULT_REPOSITORY = "KuohuaFan/pisuai-open-data";

export const catalogReleaseManifestSchema = z.object({
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rowCount: z.number().int().positive(),
  uniqueDatasetIds: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sourceUrl: z.literal(CATALOG_SOURCE_URL),
  sourcePage: z.string().url(),
  license: z.object({
    name: z.string().min(1),
    url: z.literal(CATALOG_LICENSE_URL),
  }),
  attribution: z.string().min(1),
  publisher: z.literal("評律數位科技股份有限公司"),
  publisherDisplay: z.string().min(1),
  strippedFields: z.tuple([
    z.literal(CATALOG_STRIPPED_FIELDS[0]),
    z.literal(CATALOG_STRIPPED_FIELDS[1]),
  ]),
  generatorCommit: z.string().regex(/^[a-f0-9]{7,40}$/i),
  asset: z.string().regex(/^gov-catalog-snapshot-\d{4}-\d{2}-\d{2}\.csv\.gz$/),
});

export type CatalogReleaseManifest = z.infer<
  typeof catalogReleaseManifestSchema
>;

type GitHubRelease = {
  html_url: string;
  tag_name: string;
  assets: Array<{ name: string; browser_download_url: string }>;
};

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "PiSuODS-Catalog-Importer/1.0",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok)
    throw new Error(`GitHub API returned HTTP ${response.status} for ${url}`);
  return (await response.json()) as T;
}

async function download(url: string, path: string) {
  const response = await fetch(url, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok)
    throw new Error(`Release asset returned HTTP ${response.status}: ${url}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

export async function downloadCatalogRelease(
  tag: string,
  repository = process.env.PISUODS_GITHUB_REPOSITORY ?? DEFAULT_REPOSITORY
) {
  if (!/^catalog-\d{4}-\d{2}-\d{2}$/.test(tag)) {
    throw new Error("Release tag must use catalog-YYYY-MM-DD");
  }

  const release = await fetchJson<GitHubRelease>(
    `https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`
  );
  const workDir = await mkdtemp(join(tmpdir(), "pisuods-catalog-release-"));
  await mkdir(workDir, { recursive: true });

  const required = [
    `gov-catalog-snapshot-${tag.slice("catalog-".length)}.csv.gz`,
    `gov-catalog-snapshot-${tag.slice("catalog-".length)}.sha256`,
    "manifest.json",
  ];
  const assets = new Map(release.assets.map(asset => [asset.name, asset]));
  for (const name of required) {
    const asset = assets.get(name);
    if (!asset)
      throw new Error(`Release ${tag} is missing required asset ${name}`);
    await download(asset.browser_download_url, join(workDir, name));
  }

  const manifestPath = join(workDir, "manifest.json");
  const manifest = catalogReleaseManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8"))
  );
  const archivePath = join(workDir, manifest.asset);
  const checksumPath = join(
    workDir,
    `gov-catalog-snapshot-${manifest.snapshotDate}.sha256`
  );
  if (basename(archivePath) !== required[0])
    throw new Error("Manifest asset does not match release tag");
  const sha256 = await verifySnapshotChecksum(archivePath, checksumPath);
  if (sha256 !== manifest.sha256)
    throw new Error("Manifest SHA-256 does not match the release asset");

  const csvPath = join(
    workDir,
    `gov-catalog-snapshot-${manifest.snapshotDate}.csv`
  );
  await pipeline(
    createReadStream(archivePath),
    createGunzip(),
    createWriteStream(csvPath)
  );
  return {
    csvPath,
    archivePath,
    checksumPath,
    manifestPath,
    manifest,
    releaseUrl: release.html_url,
  };
}
