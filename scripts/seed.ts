import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { automationConfigs, reports, reportSources, sources } from "../drizzle/schema";
import {
  LEGACY_REPORT_AUTOMATION_KEY,
  REPORT_AUTOMATION_KEY,
} from "../shared/const";
import { expandedSources } from "./expandedSources";
import { governmentSpecializedSources } from "./governmentSpecializedSources";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = drizzle(process.env.DATABASE_URL);
const now = Date.now();
const verifiedAt = Date.UTC(2026, 8, 15);

const registry = [
  {
    slug: "mcp-taiwan-legal-db", name: "臺灣法律資料 MCP", provider: "lawchat-oss", category: "法規與司法", accessType: "GitHub＋即時代理", codeLicense: "MIT", dataLicense: "包裝層 CC0；上游分來源", rightsClass: "MIXED" as const, featured: true,
    sourceUrl: "https://github.com/lawchat-oss/mcp-taiwan-legal-db", repoUrl: "https://github.com/lawchat-oss/mcp-taiwan-legal-db", commitSha: "03194e7b0a7437c7ed5e281d6d92c4a6df66ac65", updateCadence: "法規索引週期更新；正文即時查詢",
    description: "法規索引、沿革、憲法法庭資料與裁判／法規即時查詢層。程式、包裝資料及官方原文必須分開判權。",
    riskNote: "不得把 MIT 或資料包裝 CC0 延伸至司法院裁判或法務部法規原文；裁判另有個資與撤下風險。",
    attribution: "公開引用時應標示司法院、法務部或憲法法庭等實際上游來源，並連回官方頁面。",
  },
  {
    slug: "g0v-twlaw", name: "twlaw 法規歷史快照", provider: "g0v", category: "法規與立法", accessType: "GitHub 靜態 JSON", codeLicense: "MIT", dataLicense: "未逐資產明示", rightsClass: "B" as const, featured: false,
    sourceUrl: "https://github.com/g0v/twlaw/tree/gh-pages", repoUrl: "https://github.com/g0v/twlaw", commitSha: "389526c639c55873fb4098cd3f2fd469b7dff5a9", updateCadence: "歷史快照；非持續更新",
    description: "包含法條、歷史版本與修法紀錄的舊式 JSON 快照，適合作為歷史研究索引，不可當作現行法源。",
    riskNote: "資料快照主要停留於 2013 年；repo MIT 不代表 JSON 的上游資料授權。",
    attribution: "應標示 g0v 整理、立法院或其他實際上游，並註明快照日期。",
  },
  {
    slug: "mcp-tw-company", name: "公司與商業登記查詢 MCP", provider: "asgard-ai-platform／經濟部 GCIS", category: "公司與商業", accessType: "官方 API client", codeLicense: "MIT", dataLicense: "政府資料開放授權條款第 1 版（逐資料集）", rightsClass: "MIXED" as const, featured: true,
    sourceUrl: "https://data.gcis.nat.gov.tw/od/rule", repoUrl: "https://github.com/asgard-ai-platform/mcp-tw-company", commitSha: "1c4b1716d3fa3bc528981a652e18adec0f889c56", updateCadence: "依 GCIS API",
    description: "公司、商業、分公司、營業項目與董監事等登記資料的查詢層。一般法人欄位與自然人欄位採不同公開政策。",
    riskNote: "API 可能要求介接告知與 IP 白名單；負責人、董監事、地址及持股欄位須做個資與目的審查。",
    attribution: "資料提供機關、年份、資料釋出名稱與版本號應依 GCIS 指定格式顯名。",
  },
  {
    slug: "taiwan-atlas", name: "臺灣行政區 TopoJSON", provider: "dkaoster／內政部國土測繪中心", category: "地理與行政區", accessType: "npm／GitHub 衍生資料", codeLicense: "MIT", dataLicense: "官方幾何為 OGDL v1；衍生 mapping 待核", rightsClass: "MIXED" as const, featured: true,
    sourceUrl: "https://data.gov.tw/dataset/7438", repoUrl: "https://github.com/dkaoster/taiwan-atlas", commitSha: "60ac5fdae46c53f0ddb810c418fdb08b056273d5", updateCadence: "無定期資料更新",
    description: "將內政部縣市、鄉鎮與村里界線轉為 TopoJSON 的視覺化資料套件，另含投影、簡化與選區 mapping。",
    riskNote: "2021 套件不代表最新行政界；選區 mapping、簡化與投影衍生物不可直接視為官方法定界線。",
    attribution: "應標示內政部國土測繪中心、官方資料集版本與 OGDL v1，並記錄衍生 pipeline。",
  },
  {
    slug: "g0v-twstat", name: "twstat 公共統計快照", provider: "g0v／主計總處及地方政府", category: "公共統計", accessType: "GitHub PX／CSV", codeLicense: "MIT", dataLicense: "多來源、逐資產待核", rightsClass: "B" as const, featured: true,
    sourceUrl: "https://github.com/g0v/twstat", repoUrl: "https://github.com/g0v/twstat", commitSha: "85d76b84e49e49d04ef530fdf8de7b44a1e8cdb9", updateCadence: "歷史快照；2016 後無更新",
    description: "保存 PC-AXIS 與衍生 CSV 的縣市公共統計歷史資料，涵蓋人口、財政、醫療、教育及環境等主題。",
    riskNote: "來源混合、編碼與缺值語意複雜；不可將 2016 快照當成現況，也不可丟失 NOTE 與特殊缺值碼。",
    attribution: "逐資料集標示主計總處或地方政府來源、期間、單位及快照日期。",
  },
  {
    slug: "twbudget-parser", name: "中央政府預算解析器", provider: "clkao", category: "預算與財政", accessType: "GitHub parser", codeLicense: "README claimed CC0", dataLicense: "輸入資料另查", rightsClass: "C" as const, featured: false,
    sourceUrl: "https://github.com/clkao/twbudget", repoUrl: "https://github.com/clkao/twbudget", commitSha: "154c8b8ef5be17172a745b7eb503266e6da8ce14", updateCadence: "已停更",
    description: "將主計總處預算表人工轉成 CSV 後解析階層與金額的歷史程式；repository 本身沒有預算資料。",
    riskNote: "README CC0 不能授權上游 Excel；固定欄位與金額乘千規則需以現行格式重驗。",
    attribution: "程式與預算資料分開標示；對數值保留年度、單位、檔案 URL 與轉換版本。",
  },
  {
    slug: "gov-procurement-analytics", name: "政府採購分析工具", provider: "akaiHuang／OpenFun／公共工程委員會", category: "政府採購", accessType: "第三方 API client", codeLicense: "README claimed MIT", dataLicense: "PCC／API／附件分層", rightsClass: "B" as const, featured: true,
    sourceUrl: "https://web.pcc.gov.tw/pis/", repoUrl: "https://github.com/akaiHuang/gov-procurement-analytics", commitSha: "192d26c3d084c3db2b7bc22543129efdf60268ce", updateCadence: "人工執行",
    description: "政府採購公告的下載、JSONL 分類、關鍵字篩選與書籤分析流程；GitHub HEAD 不含採購資料快照。",
    riskNote: "第三方 API 不是官方 API；全文、附件、廠商內容及個資不可因公告公開就直接鏡像。",
    attribution: "公開索引應連回政府電子採購網，並保存 PCC 與第三方 API 的來源鏈。",
  },
  {
    slug: "twinkle-hub", name: "Twinkle Hub 臺灣資料服務", provider: "ai-twinkle", category: "政府開放資料", accessType: "遠端 MCP 服務", codeLicense: "repo 未明示；MCPB 標 MIT", dataLicense: "逐資料集傳遞上游條款", rightsClass: "B" as const, featured: false,
    sourceUrl: "https://hub.twinkleai.tw/data", repoUrl: "https://github.com/ai-twinkle/Hub", commitSha: "06d8284f3ddf42d7ba5eab0276c64dd457b520c0", updateCadence: "遠端服務維護",
    description: "提供 data.gov.tw 與政府採購等資料的遠端查詢介面；GitHub repository 主要是文件與 connector，不是資料鏡像。",
    riskNote: "服務結果與 GitHub commit 是不同生命週期；API 可查不等於可永久保存或批量再散布。",
    attribution: "每次查詢保存 dataset ID、source URL、原始 license、取得時間與 payload hash。",
  },
  {
    slug: "catenary-tdx-data", name: "TDX 交通資料 Rust client", provider: "catenarytransit／交通部 TDX", category: "交通運輸", accessType: "官方 API client", codeLicense: "AGPL-3.0", dataLicense: "逐 endpoint 免審核／需審核", rightsClass: "C" as const, featured: false,
    sourceUrl: "https://tdx.transportdata.tw/", repoUrl: "https://github.com/catenarytransit/catenary-tdx-data", commitSha: "c60f1559d37b1964cd0421da3c66e0fa9eb609af", updateCadence: "無資料排程",
    description: "公車、捷運、臺鐵與高鐵等 TDX v2／v3 資料的 Rust 模型與 API client；repository 不含交通資料檔。",
    riskNote: "AGPL 只處理 client 程式；TDX 各 endpoint 可能有不同授權、認證、額度與保存條件。",
    attribution: "依 endpoint 標示交通部 TDX 或實際資料來源單位，動態資料另記 TTL 與來源更新時間。",
  },
  {
    slug: "mcp-tw-ly", name: "立法院 API v2 MCP", provider: "asgard-ai-platform／OpenFun／立法院", category: "立法與國會", accessType: "即時 API client", codeLicense: "MIT", dataLicense: "OpenFun CC BY 敘述＋立法院官方條款", rightsClass: "MIXED" as const, featured: true,
    sourceUrl: "https://v2.ly.govapi.tw/", repoUrl: "https://github.com/asgard-ai-platform/mcp-tw-ly", commitSha: "11177f6a3cc6529b541cb0f0b5e1dbc637add90f", updateCadence: "即時查詢",
    description: "立委、議案、會議與質詢四個領域的 API 查詢層，另可能連結 HTML、PDF、文件及 IVOD 影音。",
    riskNote: "程式 MIT、API infra BSD、資料 CC BY 敘述及官方素材條款必須分離；附件、照片與影音另行審查。",
    attribution: "保留立法院、OpenFun、record ID、原始 URL、查詢時間與內容類型。",
  },
  {
    slug: "openparliamenttv-data-tw", name: "Open Parliament TV 臺灣資料樣本", provider: "OpenParliamentTV／立法院", category: "立法與國會", accessType: "GitHub JSON 快照", codeLicense: "未明示", dataLicense: "文字與影音分裂", rightsClass: "MIXED" as const, featured: false,
    sourceUrl: "https://github.com/OpenParliamentTV/OpenParliamentTV-Data-TW", repoUrl: "https://github.com/OpenParliamentTV/OpenParliamentTV-Data-TW", commitSha: "23b1db290f45af170f245012067ae149ce151c28", updateCadence: "開發中、人工更新",
    description: "少量院會的議事 JSON、AI transcript、逐句時間碼、實體與 IVOD HLS pointer 樣本。",
    riskNote: "IVOD 影音條款限制嚴格；文字 license 不能延伸至影音、AI transcript、NER 或 Wikidata entities。",
    attribution: "文字與影音分欄保存 rights URL；影音只做外部導流，不建立公開鏡像。",
  },
  {
    slug: "cdc-data-mirror", name: "CDC／NHI 公共衛生資料鏡像", provider: "peter279k／疾管署／健保署", category: "公共衛生", accessType: "GitHub workflow＋pCloud", codeLicense: "MIT", dataLicense: "逐資料集待核", rightsClass: "C" as const, featured: false,
    sourceUrl: "https://data.cdc.gov.tw/", repoUrl: "https://github.com/peter279k/cdc-data-mirror", commitSha: "e7f6dc3eddb5cb1b66b023c889aa067c04ba476f", updateCadence: "repository 已封存",
    description: "曾將部分 COVID-19 與醫療院所 CSV 轉為 JSON 並鏡像至 pCloud；Git tree 本身沒有資料檔。",
    riskNote: "pCloud 非權威來源，README、workflow 與實際鏡像可能不一致；repo MIT 不涵蓋 CDC／NHI 資料。",
    attribution: "優先連回 CDC／NHI 官方資料集，保存每個資產的 license、更新與雜湊。",
  },
];

for (const item of [...registry, ...expandedSources, ...governmentSpecializedSources]) {
  await db.insert(sources).values({ ...item, status: "active", isPublic: true, recordCount: 0, lastVerifiedAt: verifiedAt, createdAt: now, updatedAt: now }).onDuplicateKeyUpdate({ set: { ...item, status: "active", isPublic: true, lastVerifiedAt: verifiedAt, updatedAt: now } });
}

const [legacyReportAutomation] = await db
  .select({ id: automationConfigs.id })
  .from(automationConfigs)
  .where(eq(automationConfigs.key, LEGACY_REPORT_AUTOMATION_KEY))
  .limit(1);

if (!legacyReportAutomation) {
  await db
    .insert(automationConfigs)
    .values({ key: REPORT_AUTOMATION_KEY, enabled: false, cronExpression: "0 0 1 */2 * *", model: "gpt-5-mini", promptVersion: "evidence-report-v1.0", updatedAt: now })
    .onDuplicateKeyUpdate({ set: { cronExpression: "0 0 1 */2 * *", model: "gpt-5-mini", promptVersion: "evidence-report-v1.0", updatedAt: now } });
} else {
  console.warn(
    `[Seed] Deprecated automation key "${LEGACY_REPORT_AUTOMATION_KEY}" remains; apply migration 0004 before seeding the new key.`,
  );
}
await db.insert(automationConfigs).values({ key: "government-catalog-sync", enabled: false, cronExpression: "0 30 21 * * *", model: "deterministic", promptVersion: "data-gov-delta-v1.0", updatedAt: now }).onDuplicateKeyUpdate({ set: { cronExpression: "0 30 21 * * *", model: "deterministic", promptVersion: "data-gov-delta-v1.0", updatedAt: now } });

const initialSlug = "github-license-is-not-data-license";
const [existing] = await db.select({ id: reports.id }).from(reports).where(eq(reports.slug, initialSlug)).limit(1);
if (!existing) {
  const [created] = await db.insert(reports).values({
    slug: initialSlug,
    title: "GitHub 上寫著 MIT，為什麼資料仍然不能直接公開？",
    dek: "從十二個臺灣資料專案出發，理解程式碼授權、上游資料授權與公開發布權之間的落差。",
    summary: "GitHub 是重要的資料發現與工程層，但 repository 的授權標籤通常無法單獨決定上游資料、附件、影音或個資能否再散布。",
    topic: "資料治理",
    status: "published",
    sourceCount: 4,
    readingMinutes: 8,
    generatedBy: "editorial",
    reviewNote: "依 2026-09-10 repository 級查核目錄整理",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    body: `## 一個常見但危險的捷徑\n\n在 GitHub 找到標示 MIT、GPL 或 AGPL 的 repository，往往會讓人直覺認為其中一切內容都能自由使用。這個推論對程式碼可能成立，對程式抓取、整理或連結的上游資料卻通常不成立。以臺灣法律、公司登記、行政區界與立法院資料專案為例，repository 同時可能包含作者程式、官方 API 回應、第三人附件、自然人資料與衍生轉換。這些資產必須分別判讀。[1][2][3][4]\n\n## 程式碼授權處理的是程式碼\n\nMIT 授權常見於資料擷取器與 MCP client。它允許他人使用、修改及散布該軟體，但不代表開發者有權把政府資料、判決全文、影音或附件一併重新授權。例如公司登記 client 本身採 MIT，實際資料仍應回到 GCIS 的資料集條款、顯名要求與介接規則。[2]\n\n同樣地，行政區 TopoJSON 套件採 MIT，原始幾何則可追溯到內政部資料集。官方資料的政府資料開放授權提供再利用基礎，但選區 mapping、簡化、投影及作者新增欄位仍應留下獨立的衍生鏈。[3]\n\n## 「可以查」也不等於「可以鏡像」\n\n即時 API client 讓資料取得變得容易，但公開 endpoint、免 API key 或瀏覽器可讀，不能取代服務條款、存取限制及資料內容授權。立法院資料查詢層可能同時回傳結構化 JSON、文件連結與 IVOD 影音位址；其中影音、附件、第三方作品與自然人資訊的風險顯然不同。[4]\n\n因此 PisuAI 不以 repository 為最小單位，而以 asset 與 field 為治理單位。公開資料庫可以先放來源名稱、提供機關、canonical URL、commit SHA、查核日期與權利狀態；全文、附件與可重建副本則必須通過另一道閘門。\n\n## 一條可撤回的證據鏈\n\n可信資料服務不只要回答「資料從哪裡來」，還要回答「我們在什麼時候、依據哪一版條款、用什麼程式轉換」。最低限度應保存原始 URL、取得時間、原始與正規化雜湊、parser commit、授權證據與顯名文字。當上游修正資料、撤下內容或變更授權時，系統才能定位受到影響的搜尋結果、文章與衍生資料。\n\n## 方法與限制\n\n本文依 2026 年 9 月 10 日的 repository 與官方來源查核結果整理，只說明 PisuAI 的資料治理方法，不構成特定資料集的法律意見。repository、官方條款、API 狀態與資料內容都可能變更；實際利用前仍應回到各來源當期條款，並對個資、第三方素材及特殊限制進行個案審查。`,
  }).$returningId();
  const sourceRows = await db.select({ id: sources.id, slug: sources.slug, sourceUrl: sources.sourceUrl }).from(sources).where(inArray(sources.slug, ["mcp-taiwan-legal-db", "mcp-tw-company", "taiwan-atlas", "mcp-tw-ly"]));
  await db.insert(reportSources).values(sourceRows.map(source => ({ reportId: created.id, sourceId: source.id, evidenceUrl: source.sourceUrl, createdAt: now })));
}

console.log(`Seeded ${registry.length + expandedSources.length + governmentSpecializedSources.length} sources and initial publication.`);
process.exit(0);
