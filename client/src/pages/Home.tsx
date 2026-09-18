import PublicLayout from "@/components/PublicLayout";
import { SectionHeading, SourceCard, formatDate } from "@/components/DataPrimitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { HOME_DESCRIPTION, HOME_KEYWORDS_CONTENT, HOME_TITLE } from "@shared/homeSeo";
import { ArrowRight, CheckCircle2, DatabaseZap, FileCheck2, Fingerprint, Search } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

function setMetaContent(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function setMetaProperty(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function Home() {
  const sources = trpc.sources.list.useQuery({ limit: 6 });
  const reports = trpc.reports.list.useQuery({ limit: 3 });
  const facets = trpc.sources.facets.useQuery();
  const government = trpc.government.overview.useQuery();
  const sourceTotal = facets.data?.categories.reduce((sum, item) => sum + Number(item.total), 0) ?? 0;

  useEffect(() => {
    document.title = HOME_TITLE;
    setMetaContent("description", HOME_DESCRIPTION);
    setMetaContent("keywords", HOME_KEYWORDS_CONTENT);
    setMetaProperty("og:title", HOME_TITLE);
    setMetaProperty("og:description", HOME_DESCRIPTION);
    setMetaContent("twitter:title", HOME_TITLE);
    setMetaContent("twitter:description", HOME_DESCRIPTION);
  }, []);

  return (
    <PublicLayout>
      <main>
        <section className="hero-grid overflow-hidden border-b border-ink/10">
          <div className="container grid min-h-[680px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 border border-ink/15 bg-paper/70 px-3 py-2 text-xs font-semibold tracking-[0.18em] text-ink/70">
                <span className="size-2 bg-jade shadow-[0_0_0_5px_rgba(39,189,158,.12)]" />
                臺灣開放資料・持續查核中
              </div>
              <h1 className="max-w-4xl font-serif text-[clamp(3.5rem,7vw,6.8rem)] font-semibold leading-[.92] tracking-[-.045em] text-ink">
                資料有來源，<br /><span className="text-gold-dark">判斷才有重量。</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-9 text-ink/67">
                PiSuAI|紫鳥貔貅收錄臺灣官方與民間開放資料，將授權、版本、更新與風險放在同一條證據鏈上，再把資料轉化為可核實的深度報導。
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-none px-7"><Link href="/government-data"><Search className="mr-2 size-4" />搜尋政府資料全集</Link></Button>
                <Button asChild size="lg" variant="outline" className="rounded-none px-7"><Link href="/sources">查看治理來源庫<ArrowRight className="ml-2 size-4" /></Link></Button>
              </div>
              <div className="mt-12 grid max-w-3xl grid-cols-2 gap-y-6 border-y border-ink/10 py-6 sm:grid-cols-4">
                <Metric value={Number(government.data?.stats?.total ?? 0).toLocaleString() || "—"} label="政府資料集" />
                <Metric value={sourceTotal || "—"} label="治理來源" />
                <Metric value={facets.data?.categories.length ?? "—"} label="資料領域" />
                <Metric value="48h" label="報導節奏" />
              </div>
            </div>
            <div className="relative hidden min-h-[540px] lg:block">
              <div className="absolute inset-0 rotate-[-3deg] border border-gold/35 bg-navy p-8 text-white shadow-2xl shadow-navy/20">
                <div className="flex items-center justify-between border-b border-white/15 pb-5">
                  <div><p className="font-mono text-[10px] tracking-[.28em] text-gold">SOURCE REGISTRY</p><p className="mt-2 font-serif text-2xl">可信資料工作台</p></div>
                  <Fingerprint className="size-9 text-jade" />
                </div>
                <div className="network-orbit my-9 grid place-items-center">
                  <div className="grid size-40 place-items-center border border-gold/50 bg-gold/10 text-center">
                    <div><span className="block font-serif text-5xl text-gold">{facets.isLoading ? "—" : sourceTotal.toLocaleString()}</span><span className="text-xs tracking-widest text-white/50">VERIFIED SOURCES</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ["來源可追", "canonical URL / commit SHA"],
                    ["權利分級", "A / B / C / D / MIXED"],
                    ["發布可控", "AI 草稿 → 人工核准"],
                  ].map(([name, detail], index) => (
                    <div key={name} className="flex items-center justify-between border-t border-white/10 py-3 text-sm">
                      <span className="inline-flex items-center gap-3"><span className="font-mono text-jade">0{index + 1}</span>{name}</span>
                      <span className="font-mono text-[10px] text-white/42">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-5 -left-8 border border-ink/10 bg-paper px-5 py-4 shadow-xl">
                <p className="text-xs text-muted-foreground">公開原則</p><p className="mt-1 font-serif text-lg font-semibold">權利不明，就不公開。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-24">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading kicker="OPEN DATA INDEX" title="不是資料堆積，而是可以逐筆追問的來源庫。" copy="每個資料來源都帶著提供機關、取得方式、授權判讀、查核時間及使用限制。" />
            <Button asChild variant="outline" className="shrink-0 rounded-none"><Link href="/sources">查看全部來源<ArrowRight className="ml-2 size-4" /></Link></Button>
          </div>
          <div className="mt-12 grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            {sources.isLoading
              ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-none" />)
              : sources.data?.map(source => <SourceCard key={source.id} source={source} />)}
          </div>
        </section>

        <section className="border-y border-ink/10 bg-navy text-white">
          <div className="container grid gap-px bg-white/10 lg:grid-cols-3">
            {[
              [DatabaseZap, "01", "先封存，後判權", "保留原始內容、雜湊、版本及轉換鏈，再決定是否進入公開層。"],
              [FileCheck2, "02", "程式碼與資料分開授權", "MIT、GPL 或 AGPL 不會自動授權程式抓取的上游資料。"],
              [CheckCircle2, "03", "AI 不跳過人工發布", "每兩天產生的是待審草稿；證據不足時，系統必須延期或拒絕。"],
            ].map(([Icon, no, title, copy]) => {
              const ItemIcon = Icon as typeof DatabaseZap;
              return <div key={String(no)} className="bg-navy p-10"><div className="flex items-center justify-between"><ItemIcon className="size-6 text-jade" /><span className="font-mono text-xs text-gold">{String(no)}</span></div><h3 className="mt-10 font-serif text-2xl font-semibold">{String(title)}</h3><p className="mt-4 text-sm leading-7 text-white/58">{String(copy)}</p></div>;
            })}
          </div>
        </section>

        <section className="container py-24">
          <SectionHeading kicker="EDITORIAL DESK" title="兩天一次，把資料變成有證據的公共敘事。" />
          <div className="mt-12 grid gap-px bg-ink/10 lg:grid-cols-3">
            {reports.isLoading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-none" />)
              : reports.data?.map((report, index) => (
                  <article key={report.id} className="report-card">
                    <div className="flex items-center justify-between"><span className="eyebrow">{report.topic}</span><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span></div>
                    <h3 className="mt-8 font-serif text-2xl font-semibold leading-snug"><Link href={`/reports/${report.slug}`}>{report.title}</Link></h3>
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-ink/62">{report.dek}</p>
                    <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5 text-xs text-muted-foreground"><span>{formatDate(report.publishedAt)}</span><span>{report.readingMinutes} 分鐘</span></div>
                  </article>
                ))}
          </div>
          {!reports.isLoading && reports.data?.length === 0 && <div className="mt-10 border border-dashed border-ink/20 p-10 text-center text-muted-foreground">第一則深度報導正在人工審核中。</div>}
        </section>
      </main>
    </PublicLayout>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div><span className="block font-serif text-3xl font-semibold text-ink">{value}</span><span className="mt-1 block text-xs tracking-[.15em] text-muted-foreground">{label}</span></div>;
}
