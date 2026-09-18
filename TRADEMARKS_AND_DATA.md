# 程式碼、資料與品牌權利邊界

本文件說明 `KuohuaFan/pisuai-open-data` repository（以下稱「本專案」或 PiSuODS）中三組不同的權利：程式碼與技術文件、上游資料、以及 PiSuAI 品牌識別。三者各自獨立，任一組的授權不延伸到另外兩組。

## 一、本文件的適用範圍

本專案是 PiSuAI 產品線中 PiSuODS（PiSuAI Open Data System）的公開程式庫。本文件與 `LICENSE` 所稱「本專案」，僅指本 repository 實際包含的檔案。PiSuAI 產品線的其他產品、共用後端服務、模型、正式資料庫內容與部署環境，均不在本 repository 之內，亦不因本專案採 MIT License 而開源或授權。

## 二、程式碼與技術文件：MIT License

除個別檔案或目錄另有註明外，本 repository 中由本專案提供的原始碼與相關技術文件採 MIT License（見 `LICENSE`）。MIT License 允許使用、複製、修改、合併、發布、散布、再授權及銷售軟體，但必須保留著作權與授權聲明，且軟體不附任何保證。

以下檔案或目錄另有註明，不適用 MIT License：

- `docs/assets/` 目錄下的品牌資產（標誌、圖示、favicon 及其衍生檔），其使用條件見 `docs/assets/NOTICE`。
- `data/` 目錄下的政府資料 metadata 樣本、manifest 與 NOTICE，以及 GitHub Actions 建置時生成的 `catalog/` 分層索引；其上游資料授權與顯名要求見 `data/NOTICE`，不適用本專案的 MIT License。
- 未來若加入其他例外，將在該檔案或目錄放置 NOTICE 或於檔頭註明。

### 人工發布閘門與其他預設治理設計

本專案內建的人工發布閘門（AI 產生的報導草稿須經管理者審核方可公開）、五類再利用治理分類、來源查核卡格式與 Pull Request 收錄規則，是本專案的預設實作與 PiSuODS 官方服務的營運政策。這些設計**不構成對 MIT License 授權權利的額外限制**：取得本專案程式碼的第三人依 MIT License 得修改、移除或替換這些設計。但第三人公開部署時，仍須自行承擔上游資料授權、個人資料保護、名譽與其他法律風險；本專案不因第三人移除治理設計而承擔任何責任。

## 三、上游資料不隨程式碼授權

政府資料集、民間資料、裁判、附件、圖片、地圖、第三方 API 回應與其他上游內容，不因本 repository 採 MIT License 而取得授權。每個使用者與 Fork 維護者都必須核對原始來源的最新授權、顯名要求、服務條款、個人資料及第三人權利。

本 repository 不包含正式資料庫備份，也不把政府資料開放平臺的完整目錄快照或完整生成索引提交進 Git 歷史。完整壓縮快照以 GitHub Release 資產提供，`catalog/` 則由 GitHub Actions 下載快照、驗證 SHA-256 後重新生成；repository 只保存 100 筆 metadata 樣本、manifest、NOTICE 與生成腳本。治理來源卡與同步程式只協助定位及判讀來源，不保證每筆上游資料都可公開重製、建立衍生著作或商業使用。

政府資料目錄快照的共用顯名為：「資料來源：數位發展部 YYYY『政府資料開放平臺資料集清單』（data.gov.tw，YYYY-MM-DD 快照），依政府資料開放授權條款第 1 版利用；本索引為 metadata 再整理，非原始資料，亦非經人工查核之來源卡。」各筆資料仍依其原始 `license` 欄位及官方頁面所載條件利用；評律數位科技股份有限公司的整理與發布不表示政府資料開放平臺或任何資料提供機關為 PiSuODS 背書。

### 五類再利用治理分類的性質

本專案以 A（可公開再利用）、B（僅索引與導流）、C（限內部使用）、D（另取授權）、MIXED（逐欄審查）五類標記來源。這是平台內部的判讀標籤，用於決定本專案官方服務如何處理該來源；它**不是**新的授權、不取代原始授權、也不構成對任何來源權利狀態的法律意見。標記為 A 的來源仍須依其原始授權條款使用。

## 四、PiSuAI 品牌識別

MIT License 授權的是程式碼與文件，不自動授予使用下列來源識別的權利：

- `PiSuAI`
- `PiSuAI|紫鳥貔貅`（含以全形「｜」或其他分隔符呈現的同一標識）
- `PiSuODS`、`PiSuAI Open Data System`
- 紫鳥貔貅標誌、產品外觀、配色及其他足以使人聯想本專案官方服務的識別

第三人不得以上述識別使人誤認其 Fork、部署或衍生作品為官方版本、獲得背書或與 PiSuAI 有合作關係。

Fork 可以在文件中以必要且合理的方式說明「基於 PiSuODS／PiSuAI 開源專案」，但應清楚標示修改者、與原專案的關係及非官方性質。公開部署或重新散布時，應改用自己的名稱、網域與視覺識別，並移除或替換 `docs/assets/` 下的品牌資產。

## 五、貢獻內容

提交 Pull Request 前，貢獻者須依 `CONTRIBUTING.md` 以 Developer Certificate of Origin（DCO）簽署每一個 commit（`git commit -s`）。簽署表示貢獻者有權提供該內容，並同意以本 repository 的 MIT License 授權其程式碼與技術文件。若貢獻包含第三方內容，必須在 Pull Request 中指出來源、授權與必要顯名；權利不明的內容將不予合併。

## 六、著作權歸屬

本專案程式碼與技術文件的著作權人為評律數位科技股份有限公司（見 LICENSE）。PiSuAI、PiSuODS 等品牌識別的權利人亦為評律數位科技股份有限公司。任何權利授權或爭議，請依 SECURITY.md 或 repository 所列聯絡方式洽詢。

## 參考來源

1. MIT License（Open Source Initiative）：https://opensource.org/license/mit
2. 政府資料開放授權條款第 1 版：https://data.gov.tw/license
3. Developer Certificate of Origin 1.1：https://developercertificate.org/
