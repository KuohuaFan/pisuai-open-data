import { invokeLLM, listLLMModels } from "./_core/llm";
import {
  createIngestionRun,
  createReport,
  finishIngestionRun,
  getReportCandidateSources,
} from "./db";

const PROMPT_VERSION = "evidence-report-v1.0";

type GeneratedReport = {
  title: string;
  dek: string;
  summary: string;
  topic: string;
  body: string;
};

export function deterministicDraft(sourceNames: string[]): GeneratedReport {
  const cited = sourceNames.map((name, index) => `${index + 1}. ${name}`).join("\n");
  return {
    title: "開放資料不等於無條件開放：PisuAI 的來源治理方法",
    dek: "從資料發現、授權拆分到人工發布，建立每一項事實都可回到來源的知識基礎。",
    summary: "本期整理 PisuAI 已核對的資料來源，說明為何 repository 授權、上游資料授權與公開發布權必須分別記錄。",
    topic: "資料治理",
    body: `## 本期觀察\n\nGitHub 與官方資料平台可以大幅降低資料發現及工程整合成本，但「可以下載」不等於「可以無條件再散布」。PisuAI 將程式碼、資料內容、第三方素材、個資與服務條款分開管理，並在公開前保留人工審核。\n\n## 可追溯比收錄量更重要\n\n每個來源都應保留 canonical URL、查核時間、版本或 commit SHA、原始檔雜湊、授權證據與顯名文字。當上游撤下、修正或變更條款時，系統才能定位受影響的搜尋結果、文章與衍生資料。\n\n## 本期來源\n\n${cited}\n\n## 編輯說明\n\n本文為系統依已登錄來源產生的待審草稿。未經編輯核准前不會自動公開；涉及授權不明、個資、附件或影音的內容，一律停留於受控層。`,
  };
}

export async function generateEvidenceBoundDraft(options?: {
  trigger?: "manual" | "scheduled" | "webhook";
  actorUserId?: number;
}) {
  const trigger = options?.trigger ?? "manual";
  const runId = await createIngestionRun(trigger);
  try {
    const candidates = await getReportCandidateSources(8);
    if (candidates.length < 2) {
      await finishIngestionRun(runId, "skipped", "可用且可公開引用的來源不足，未建立草稿。", candidates.length, 0);
      return { ok: true as const, skipped: true as const, reason: "insufficient_sources" };
    }

    const catalog = await listLLMModels();
    const model = catalog.data.some(item => item.id === "gpt-5-mini")
      ? "gpt-5-mini"
      : catalog.data[0]?.id;
    if (!model) throw new Error("No built-in LLM model is available");

    const evidence = candidates.map((source, index) => ({
      citation: index + 1,
      id: source.id,
      name: source.name,
      provider: source.provider,
      category: source.category,
      description: source.description,
      rightsClass: source.rightsClass,
      dataLicense: source.dataLicense,
      sourceUrl: source.sourceUrl,
      repoUrl: source.repoUrl,
      riskNote: source.riskNote,
      lastVerifiedAt: source.lastVerifiedAt,
    }));

    let article: GeneratedReport;
    try {
      const response = await invokeLLM({
        model,
        reasoning: { effort: "low" },
        messages: [
          {
            role: "system",
            content:
              "你是 PiSuAI｜貔貅智慧的資料調查編輯。只能使用使用者提供的來源卡片，不得補造數字、授權結論、法律結論或即時事件。撰寫繁體中文深度報導草稿，清楚區分已知、限制與待查事項。內文使用 Markdown；每個可核實主張以 [1]、[2] 形式引用來源卡片。不得聲稱本文已經人工審核或已發布。",
          },
          {
            role: "user",
            content: `請依以下來源卡片產生一篇 1200–1800 字的深度報導草稿。主題優先選擇跨來源、對公眾有價值且能呈現資料治理意義的議題。結尾須有「方法與限制」段落。\n\n${JSON.stringify(evidence)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pisuai_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                dek: { type: "string" },
                summary: { type: "string" },
                topic: { type: "string" },
                body: { type: "string" },
              },
              required: ["title", "dek", "summary", "topic", "body"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content;
      if (typeof content !== "string") throw new Error("LLM returned no text content");
      article = JSON.parse(content) as GeneratedReport;
    } catch (error) {
      console.error("[ReportGenerator] LLM generation failed; using controlled fallback", error);
      article = deterministicDraft(candidates.map(source => source.name));
    }

    const report = await createReport({
      ...article,
      sourceIds: candidates.map(source => source.id),
      model,
      promptVersion: PROMPT_VERSION,
      createdBy: options?.actorUserId,
    });
    await finishIngestionRun(
      runId,
      "succeeded",
      `已建立待人工審核草稿：${report.slug}`,
      candidates.length,
      1,
    );
    return { ok: true as const, skipped: false as const, report };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishIngestionRun(runId, "failed", message);
    throw error;
  }
}
