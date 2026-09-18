# PiSuAI 開源發布核准摘要

## 已完成的公開設定

| 項目            | 設定                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| Repository 名稱 | `KuohuaFan/pisuai-open-data`                                               |
| 可見性          | `Public`，任何人都能瀏覽、Clone 與 Fork                                    |
| 程式碼授權      | MIT License；Copyright (c) 2026 PingLex Digital Technology Co., Ltd. (評律數位科技股份有限公司) and PiSuODS contributors |
| 社群入口        | Issues、Discussions、Pull Requests 與三種結構化 Issue Forms                |
| GitHub Pages    | 改用 `https://kuohuafan.github.io/pisuai-open-data/`，來源仍為 `main/docs` |
| 完整平臺        | `https://opendataset.manus.space/`，不因 repository 公開而改變             |
| 品牌名稱        | `PiSuAI\|紫鳥貔貅`                                                         |
| 品牌 Logo       | 使用者提供的紫鳥圓形 Logo；提供 WebP 與 favicon PNG                        |

## 將公開的內容

目前 repository 的完整 Git 歷史與原始碼已公開，包括 React／Express／tRPC 應用程式、Drizzle schema 與 migration、政府資料目錄同步器、治理來源定義、測試、GitHub Pages、README，以及新增的貢獻、安全、治理、路線圖與權利邊界文件。

## 不會公開的內容

Repository 不包含正式資料庫內容、全國政府資料 CSV 快照、`.env`、OAuth 憑證、JWT secret、模型金鑰或部署平台 secret。本機忽略的執行期網路日誌不會進入 Git，並已從工作目錄清除。

## 權利邊界

MIT License 只涵蓋本專案自行提供的程式碼與技術文件，不會把政府資料、民間資料、第三方附件或 API 回應重新授權。`PiSuAI`、`PiSuAI|紫鳥貔貅`、`PiSuODS` 與品牌識別不因程式碼開源而授權第三人表示官方關係或背書。Fork 可以說明其源自 PiSuAI，但應清楚標示修改者與非官方性質。

## 驗證結果

Gitleaks 8.30.1 已掃描即將提交的公開檔案與完整 Git diff 歷史，結果均為 0 個 secrets。Git 歷史最大 blob 約 323 KB，沒有資料庫 dump 或大型資料檔。9 個測試檔共 28 項測試全部通過，TypeScript 檢查與 production build 亦通過。Issue Form YAML、JSON、Markdown 本地連結與必要文件均已驗證。

報導草稿自動化已改用 `generate-report-draft` key 與 `/api/scheduled/generate-report-draft` 路徑。`0004_rename_report_automation_key.sql` 會保留既有 task UID 與執行紀錄，並提供一個大版本的舊 key 相容期；正式部署必須同時套用 migration 並更新 Manus 排程路徑。

Repository 公開後已啟用 GitHub secret scanning、push protection、Dependabot security updates 與私密漏洞通報。直接依賴及必要的傳遞依賴已升級至相同大版本的修補版本；`pnpm audit --prod` 的 critical 與 high 均降為 0。其餘 25 個 moderate 與 5 個 low 公告保留由 Dependabot 追蹤，避免為消除低風險報告而進行未經驗證的大版本升級。

## 公開後設定

所有 repository 與 GitHub Pages URL 已更新。Issues、Discussions、私密漏洞通報、治理標籤、MIT License、Fork、Issue Forms 與 Pull Request 模板均已啟用。新 GitHub Pages 網址已回傳 HTTP 200，品牌名稱與 Logo 資產均正常載入。

## GitHub 公開驗證

2026 年 9 月 17 日已用未帶 GitHub Token 的 HTTPS Clone 驗證公開存取，匿名 Clone 的 HEAD 與發布 commit 一致。GitHub repository 首頁顯示 Public、Fork、Issues、Pull requests、Discussions、Actions、MIT License、紫鳥 Logo 與完整 README；Community Profile 為 100%。Issue 建立頁顯示錯誤回報、資料來源提案、功能或優化提案三種表單，另提供 Security Advisory 私密通報及 Discussions 入口。

GitHub Actions `CI` 已在 main 分支成功完成 frozen-lockfile 安裝、19 項測試、TypeScript 型別檢查與 production build。main 分支現要求 `Test, type-check and build` 成功、至少一筆核准、CODEOWNERS 審查、所有對話解決及線性歷史；禁止 force push 與刪除分支。管理者仍保留緊急繞過權限。

## References

[1]: https://choosealicense.com/licenses/mit/ "MIT License overview and standard text"
[2]: https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility "GitHub repository visibility documentation"
[3]: https://docs.github.com/repositories/creating-and-managing-repositories/renaming-a-repository "GitHub repository rename documentation"
