# 政府資料目錄樣本與快照說明

本目錄只保存 **100 筆最小 metadata 樣本**、快照 manifest 與授權／顯名 NOTICE，供測試欄位映射、索引生成及文件範例使用。`sample/gov-catalog-sample-100.csv` **不是完整快照，也不是正式資料庫備份**。

為避免不必要地再散布個人聯絡資訊並降低再識別風險，100 筆樣本與 GitHub Release 快照均保留官方 22 欄表頭，但已將「提供機關聯絡人姓名」及「提供機關聯絡人電話」兩欄值全部清空。

> 資料來源：政府資料開放平臺（data.gov.tw），依政府資料開放授權條款第 1 版利用；快照日期 2026-09-15；本索引為 metadata 再整理，非原始資料，亦非經人工查核之來源卡。

完整 CSV 壓縮快照不進入 Git 歷史。請從 [`catalog-2026-09-15` GitHub Release](https://github.com/KuohuaFan/pisuai-open-data/releases/tag/catalog-2026-09-15) 下載 `gov-catalog-snapshot-2026-09-15.csv.gz`、`.sha256` 與 `manifest.json`，先驗證 checksum，再執行：

```bash
pnpm exec tsx scripts/syncGovernmentCatalog.ts \
  full --from-release catalog-2026-09-15
```

或者直接從官方目錄匯出 API 取得最新 CSV，再使用 `full <csv-path>` 模式。Release 快照、此樣本與衍生索引都不適用程式碼的 MIT License；請依 [`NOTICE`](./NOTICE) 與每筆 `license` 欄位處理。

GitHub Pages 在負責人核准改用 GitHub Actions 發布後，公開索引網址將為：<https://kuohuafan.github.io/pisuai-open-data/catalog/>。
