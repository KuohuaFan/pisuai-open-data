# PiSuAI 開源發布核准摘要

## 擬執行的公開設定

| 項目            | 設定                                                                       |
| --------------- | -------------------------------------------------------------------------- | --------- |
| Repository 名稱 | `KuohuaFan/pisuai-open-data`，由目前的 `pisuai-open-data` 重新命名         |
| 可見性          | `Public`，任何人都能瀏覽、Clone 與 Fork                                    |
| 程式碼授權      | MIT License；Copyright (c) 2026 KuohuaFan and PiSuAI contributors          |
| 社群入口        | Issues、Discussions、Pull Requests 與三種結構化 Issue Forms                |
| GitHub Pages    | 改用 `https://kuohuafan.github.io/pisuai-open-data/`，來源仍為 `main/docs` |
| 完整平臺        | `https://opendataset.manus.space/`，不因 repository 公開而改變             |
| 品牌名稱        | `PiSuAI                                                                    | 紫鳥貔貅` |
| 品牌 Logo       | 使用者提供的紫鳥圓形 Logo；提供 WebP 與 favicon PNG                        |

## 將公開的內容

將公開目前 repository 的完整 Git 歷史與原始碼，包括 React／Express／tRPC 應用程式、Drizzle schema 與 migration、政府資料目錄同步器、治理來源定義、測試、GitHub Pages、README，以及新增的貢獻、安全、治理、路線圖與權利邊界文件。

## 不會公開的內容

Repository 不包含正式資料庫內容、全國政府資料 CSV 快照、`.env`、OAuth 憑證、JWT secret、模型金鑰或部署平台 secret。本機忽略的執行期網路日誌不會進入 Git，並已從工作目錄清除。

## 權利邊界

MIT License 只涵蓋本專案自行提供的程式碼與技術文件，不會把政府資料、民間資料、第三方附件或 API 回應重新授權。`PiSuAI`、`PiSuAI|紫鳥貔貅` 與品牌識別不因程式碼開源而授權第三人表示官方關係或背書。Fork 可以說明其源自 PiSuAI，但應清楚標示修改者與非官方性質。

## 驗證結果

Gitleaks 8.30.1 已掃描即將提交的公開檔案與完整 Git diff 歷史，結果均為 0 個 secrets。Git 歷史最大 blob 約 323 KB，沒有資料庫 dump 或大型資料檔。7 個測試檔共 19 項測試全部通過，TypeScript 檢查與 production build 亦通過。Issue Form YAML、JSON、Markdown 本地連結與必要文件均已驗證。

## 公開後立即設定

公開後將更新所有 repository 與 GitHub Pages URL、啟用 Discussions、保留 Issues、建立治理標籤，並檢查 License、Fork 按鈕、Issue Forms、Pull Request 模板與 Pages 網站。Repository 名稱變更可能使 GitHub Pages 短暫重新建置；GitHub 通常會轉址舊 repository URL，但正式文件會全部改用新網址。

## References

[1]: https://choosealicense.com/licenses/mit/ "MIT License overview and standard text"
[2]: https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility "GitHub repository visibility documentation"
[3]: https://docs.github.com/repositories/creating-and-managing-repositories/renaming-a-repository "GitHub repository rename documentation"
