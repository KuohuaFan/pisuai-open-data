# 安全政策

## 支援版本

本專案目前只對 `main` 分支最新版本提供安全修正。歷史 commit、私人 fork 與未合併分支不在支援範圍內。

## 私密回報

請不要透過公開 Issue 回報可利用的安全漏洞、憑證、未公開個資或可造成資料外洩的細節。請使用 repository 的 **Security → Advisories → Report a vulnerability** 私密通報功能。

通報內容應包括受影響的版本或 commit、重現步驟、可能影響、概念驗證，以及您已採取的安全限制。請不要存取超出驗證所需的資料，也不要中斷正式服務。

## 處理流程

維護者會先確認是否收到通報，再評估可利用性、資料影響與修復範圍。必要時會建立私人修補分支、通知受影響部署者，並在修復可用後發布安全公告。處理時程取決於嚴重性、重現難度與上游依賴。

## 不屬於安全漏洞的事項

一般功能錯誤、資料來源失效、文字錯誤與不含敏感資訊的建議，請使用公開 Issue。上游政府資料不正確時，請同時提供官方頁面或可核對的版本資訊；本專案不代表上游機關修正其原始資料。

## 安全邊界

正式資料庫、OAuth 憑證、模型金鑰及部署平台 secrets 不屬於 repository 內容。Fork 維護者必須自行產生金鑰、限制管理者權限、保護排程端點，並依所在地法律處理日誌、個資與資料保留。

## References

[1]: https://docs.github.com/code-security/security-advisories/working-with-repository-security-advisories/about-repository-security-advisories "GitHub repository security advisories"
