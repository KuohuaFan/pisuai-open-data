import { describe, expect, it } from "vitest";
import {
  normalizeGovernmentRow,
  previousTaipeiDate,
  resolveFullSyncProvenance,
} from "./governmentCatalog";

describe("government catalog normalization", () => {
  it("maps official Chinese metadata fields without copying contact details", () => {
    const row = normalizeGovernmentRow(
      {
        資料集識別碼: 6564,
        資料集名稱: "政府資料集清單",
        服務分類: "公共資訊",
        提供機關: "數位發展部",
        資料集描述: "全國資料集 metadata",
        資料下載網址: "https://data.gov.tw/datasets/export/csv",
        授權方式: "政府資料開放授權條款-第1版",
        上架日期: "2013-01-01 00:00:00",
        詮釋資料更新時間: "2026-09-15 01:00:00",
        提供機關聯絡人姓名: "不應儲存",
        提供機關聯絡人電話: "不應儲存",
      },
      123456
    );
    expect(row).toMatchObject({
      datasetId: "6564",
      title: "政府資料集清單",
      status: "active",
      lastSeenAt: 123456,
    });
    expect(row).not.toHaveProperty("提供機關聯絡人姓名");
    expect(row?.modifiedAt).toBeTypeOf("number");
  });

  it("preserves withdrawn state from a delta record", () => {
    expect(
      normalizeGovernmentRow(
        {
          資料集識別碼: "88",
          資料集名稱: "已下架資料",
          服務分類: "公共資訊",
          提供機關: "測試機關",
          資料集變動狀態: "資料集下架",
        },
        10
      )?.status
    ).toBe("withdrawn");
  });

  it("uses the previous calendar date in Taipei", () => {
    expect(previousTaipeiDate(new Date("2026-09-15T00:30:00Z"))).toBe(
      "2026-09-14"
    );
  });

  it("records release snapshotDate and compressed asset sha256", () => {
    expect(
      resolveFullSyncProvenance("csv-sha", {
        snapshotDate: "2026-09-15",
        sha256: "release-sha",
      })
    ).toEqual({
      reportDate: "2026-09-15",
      snapshotSha256: "release-sha",
      sourceFileSha256: "csv-sha",
    });
  });
});
