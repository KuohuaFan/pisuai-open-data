import { BRAND } from "./brand";

export const HOME_TITLE =
  "PiSuODS｜PiSuAI 紫鳥貔貅・臺灣開放資料與深度報導平台";

export const HOME_DESCRIPTION =
  "PiSuAI 產品線中的臺灣開放資料平台，以來源追溯、再利用治理分類與人工發布閘門為核心；程式碼 MIT 開源。";

export const HOME_KEYWORDS = [
  "臺灣開放資料",
  "政府資料庫",
  "GitHub開源資料",
  "資料治理",
  "授權查核",
  "深度報導",
  BRAND.name,
] as const;

export const HOME_KEYWORDS_CONTENT = HOME_KEYWORDS.join(",");

export function unicodeLength(value: string) {
  return Array.from(value).length;
}
