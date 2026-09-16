# 貢獻 PiSuAI

感謝您協助改善 PiSuAI｜貔貅智慧。此專案接受程式碼、測試、文件、無障礙、資料治理規則、資料來源查核與介面設計等貢獻。

## 開始之前

請先搜尋既有 Issue，避免重複工作。小型修正可以直接提出 Pull Request；新增功能、資料模型變更、大型重構或可能影響資料公開範圍的提案，請先建立 Issue 說明問題、預期結果與替代方案。

所有參與者都必須遵守 [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)。安全漏洞與可能外洩的個人資料不得透過公開 Issue 回報，請依 [`SECURITY.md`](./SECURITY.md) 使用私密通報管道。

## Fork 與本機開發

1. Fork repository，從 `main` 建立功能分支。
2. 使用 Node.js 22 與 pnpm 10 安裝依賴。
3. 準備 MySQL 8 相容或 TiDB 資料庫，並在未納入 Git 的本機 `.env` 設定必要環境變數。
4. 套用 migration，匯入治理來源，啟動開發伺服器。

```bash
git clone https://github.com/<YOUR_ACCOUNT>/pisuai-open-data-backup.git
cd pisuai-open-data-backup
corepack enable
pnpm install

pnpm exec drizzle-kit migrate
pnpm exec tsx scripts/seed.ts
pnpm dev
```

Manus OAuth、內建 LLM、通知及儲存服務使用 Manus WebDev 提供的環境與端點。若部署到其他平臺，公開資料搜尋仍可沿用，但登入、AI 報導、通知及檔案功能需要替換對應 adapter。請勿提交任何真實憑證或正式資料庫內容。

## 開發規則

程式碼應維持 TypeScript 型別安全。前端透過 tRPC 存取後端，不新增平行的 Axios 或自製 REST 資料層。資料庫變更必須同時更新 `drizzle/schema.ts`，產生 migration，並人工審查 SQL。

```bash
pnpm exec drizzle-kit generate
pnpm test -- --run
pnpm check
pnpm build
```

Pull Request 至少應說明變更原因、驗證方式、畫面變更，以及 migration 或權利政策的影響。若修改手機或桌機介面，請附上前後截圖。若變更資料同步流程，請提供冪等性、失敗重試與上游限流的驗證結果。

## 新增資料來源

資料來源提案必須包含：

- canonical URL 與實際提供機關；
- 資料取得方式、格式、更新頻率及版本資訊；
- 資料授權、程式碼授權及必要顯名；
- 個資、名譽、再識別、第三人著作與服務條款風險；
- 建議權利分級，以及可以公開的欄位或只應索引導流的內容；
- 至少一項可重現的驗證方式。

請勿提交抓取來的完整敏感資料、未去識別的個人資料、付費內容、登入憑證、政府內部文件或權利不明的附件。收錄 metadata 不代表原始資料已經取得再授權。

## Commit 與 Pull Request

建議使用簡潔的 Conventional Commits，例如：

```text
feat: add environmental dataset filter
fix: preserve metadata during delta sync
docs: clarify upstream data licensing
```

提交貢獻即表示您有權提供該內容，並同意依本 repository 的 MIT License 授權該貢獻。維護者可以要求拆分大型變更、補充測試，或因安全、權利與維護成本拒絕合併。

## 審查原則

維護者會優先考量正確性、可重現性、來源可追溯性、權利邊界、向下相容性與維護成本。涉及裁判、醫療、政治獻金、公司關係、不動產或行政裁罰的變更，會採取較保守的公開策略。

## References

[1]: https://opensource.org/license/mit "MIT License"
[2]: https://www.contributor-covenant.org/version/2/1/code_of_conduct/ "Contributor Covenant Code of Conduct 2.1"
