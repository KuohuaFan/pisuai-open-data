import { SectionHeading } from "@/components/DataPrimitives";
import PublicLayout from "@/components/PublicLayout";
import { AlertTriangle, Archive, CheckCircle2, FileSearch, GitCommitHorizontal, Scale, UserCheck } from "lucide-react";

const tiers = [
  ["A", "可公開再利用", "上游授權、顯名、版本、個資與第三方權利已完成查核。"],
  ["B", "僅索引與導流", "可公開識別碼、標題、必要摘要與來源連結，不公開完整副本。"],
  ["C", "限內部使用", "權利或保存條件尚未完成，只能進入受控研究層。"],
  ["D", "另取授權", "影音、附件、特殊條款或權利衝突，公開前需另行取得依據。"],
  ["MIXED", "逐欄審查", "同一專案混合程式碼、上游資料與衍生物，不能整包判定。"],
];

export default function Methodology() {
  return (
    <PublicLayout>
      <main>
        <section className="border-b border-ink/10 bg-paper-deep"><div className="container py-20"><SectionHeading kicker="METHOD & GOVERNANCE" title="開放，不代表放棄查核。" copy="PiSuAI 以資料資產與欄位為最小治理單位，把來源、授權、版本、品質與發布決策留在同一條可稽核證據鏈。" /></div></section>
        <section className="container py-20">
          <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
            <div><p className="eyebrow">RIGHTS CLASSES</p><h2 className="mt-5 font-serif text-4xl font-semibold">五種使用政策</h2><p className="mt-5 text-sm leading-7 text-ink/62">這些是 PisuAI 的內部治理標籤，不是對法律效果的抽象宣告。分級會隨來源條款、資料內容或風險變更。</p></div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">{tiers.map(([key, title, copy]) => <div key={key} className="grid gap-3 py-6 sm:grid-cols-[110px_190px_1fr]"><span className="font-mono text-sm font-bold text-gold-dark">{key}</span><strong>{title}</strong><p className="text-sm leading-7 text-ink/62">{copy}</p></div>)}</div>
          </div>
        </section>
        <section className="bg-navy text-white"><div className="container py-20"><p className="eyebrow !text-jade">48-HOUR CYCLE</p><h2 className="mt-5 max-w-3xl font-serif text-4xl font-semibold sm:text-5xl">每兩天一篇，不代表每兩天硬發一篇。</h2><div className="mt-12 grid gap-px bg-white/10 md:grid-cols-3 lg:grid-cols-6">{[
          [Archive, "資料增量", "比對來源與版本"], [GitCommitHorizontal, "固定證據", "保存雜湊與時間"], [FileSearch, "候選選題", "篩除低證據題目"], [Scale, "權利檢查", "阻擋 C／D 內容"], [UserCheck, "人工審核", "確認引用與表述"], [CheckCircle2, "核准發布", "保留更正與撤下"],
        ].map(([Icon, title, copy], index) => { const StepIcon = Icon as typeof Archive; return <div key={String(title)} className="bg-navy p-6"><span className="font-mono text-xs text-gold">0{index + 1}</span><StepIcon className="mt-10 size-6 text-jade" /><h3 className="mt-5 font-serif text-lg">{String(title)}</h3><p className="mt-2 text-xs leading-6 text-white/45">{String(copy)}</p></div>; })}</div></div></section>
        <section className="container py-20"><div className="grid gap-10 lg:grid-cols-2"><div><p className="eyebrow">GITHUB POLICY</p><h2 className="mt-5 font-serif text-4xl font-semibold">GitHub 是發現與工程層，不是自動授權層。</h2></div><div className="space-y-5 text-base leading-8 text-ink/65"><p>repository 的 MIT、GPL、AGPL 或 CC0 通常只證明程式碼或作者自有包裝的授權，不能直接授權其抓取的政府資料、影音、附件或第三方內容。</p><p>因此，PiSuAI 同時保存 repository commit SHA、上游 canonical URL、資料授權、取得時間、原始與正規化雜湊，以及 parser／ETL 版本。</p><div className="flex gap-3 border-l-4 border-gold bg-paper-deep p-5 text-sm"><AlertTriangle className="mt-1 size-5 shrink-0 text-gold-dark" /><p>若授權不明、含個資、第三方影音或附件，內容一律進入受控區，不會加入公開搜尋、報導或模型生成。</p></div></div></div></section>
      </main>
    </PublicLayout>
  );
}
