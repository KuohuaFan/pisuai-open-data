export const CATALOG_SOURCE_URL =
  "https://data.gov.tw/api/v2/rest/dataset/export";
export const CATALOG_SOURCE_PAGE = "https://data.gov.tw/dataset/6564";
export const CATALOG_LICENSE_NAME = "政府資料開放授權條款第 1 版";
export const CATALOG_LICENSE_URL = "https://data.gov.tw/license";
export const CATALOG_PUBLISHER = "評律數位科技股份有限公司";
export const CATALOG_PUBLISHER_ENGLISH = "PingLex Digital Technology Co., Ltd.";
export const CATALOG_PUBLISHER_BILINGUAL = `${CATALOG_PUBLISHER}（${CATALOG_PUBLISHER_ENGLISH}）`;

export function assertSnapshotDate(snapshotDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    throw new Error(
      `Invalid snapshot date: ${snapshotDate}. Expected YYYY-MM-DD.`
    );
  }
}

export function catalogAttribution(snapshotDate: string) {
  assertSnapshotDate(snapshotDate);
  const year = snapshotDate.slice(0, 4);
  return `資料來源：數位發展部 ${year}「政府資料開放平臺資料集清單」（data.gov.tw，${snapshotDate} 快照），依政府資料開放授權條款第 1 版利用；本索引為 metadata 再整理，非原始資料，亦非經人工查核之來源卡。`;
}
