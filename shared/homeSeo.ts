export const HOME_TITLE = "PiSuAI 貔貅智慧｜臺灣政府開放資料庫、GitHub開源資料、授權查核與深度報導平台";

export const HOME_DESCRIPTION = "PiSuAI 貔貅智慧整合臺灣政府、司法、立法、公司、交通及民間 GitHub 開源資料，提供來源追溯、授權分級、版本查核、關鍵字搜尋與深度報導。所有 AI 草稿皆須經人工審核後發布，協助研究者、法律人、企業與開發者安全運用可信資料，快速掌握公共資訊脈絡、資料限制、更新紀錄、證據鏈及最新治理狀態。";

export const HOME_KEYWORDS = [
  "臺灣開放資料",
  "政府資料庫",
  "GitHub開源資料",
  "資料治理",
  "授權查核",
  "深度報導",
  "PiSuAI貔貅智慧",
] as const;

export const HOME_KEYWORDS_CONTENT = HOME_KEYWORDS.join(",");

export function unicodeLength(value: string) {
  return Array.from(value).length;
}
