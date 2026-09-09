import { SectionHeading, formatDate } from "@/components/DataPrimitives";
import PublicLayout from "@/components/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Clock3, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Reports() {
  const reports = trpc.reports.list.useQuery({ limit: 60 });
  return (
    <PublicLayout>
      <main>
        <section className="border-b border-ink/10 bg-navy text-white">
          <div className="container grid gap-10 py-20 lg:grid-cols-[1fr_360px] lg:items-end">
            <div><p className="eyebrow !text-jade">PISUAI JOURNAL</p><h1 className="mt-5 max-w-4xl font-serif text-5xl font-semibold leading-tight sm:text-7xl">深度報導，不離開證據鏈。</h1><p className="mt-7 max-w-2xl text-base leading-8 text-white/60">每一篇文章都從已登錄來源出發，保留引用、版本及方法限制。系統每兩天可建立草稿，但公開發布必須經過人工核准。</p></div>
            <div className="border-l border-white/15 pl-8"><p className="font-serif text-6xl text-gold">48</p><p className="mt-1 text-xs tracking-[.24em] text-white/48">HOUR EDITORIAL CYCLE</p></div>
          </div>
        </section>
        <section className="container py-20">
          <SectionHeading kicker="LATEST STORIES" title="資料所指向的臺灣" />
          <div className="mt-12 grid gap-px bg-ink/10 md:grid-cols-2">
            {reports.isLoading
              ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-none" />)
              : reports.data?.map((report, index) => (
                <article key={report.id} className={`group bg-paper p-8 transition-colors hover:bg-paper-deep ${index === 0 ? "md:col-span-2 md:grid md:grid-cols-[.7fr_1.3fr] md:gap-12" : ""}`}>
                  <div><span className="eyebrow">{report.topic}</span><p className="mt-6 font-mono text-xs text-muted-foreground">ISSUE {String(index + 1).padStart(3, "0")}</p></div>
                  <div><h2 className={`font-serif font-semibold leading-tight text-ink group-hover:text-gold-dark ${index === 0 ? "mt-5 text-4xl md:mt-0 md:text-5xl" : "mt-6 text-3xl"}`}><Link href={`/reports/${report.slug}`}>{report.title}</Link></h2><p className="mt-5 text-sm leading-7 text-ink/62">{report.dek}</p><div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5 text-xs text-muted-foreground"><span>{formatDate(report.publishedAt)} · {report.sourceCount} 個來源</span><span className="inline-flex items-center gap-2"><Clock3 className="size-3.5" />{report.readingMinutes} 分鐘<ArrowUpRight className="size-4 text-ink" /></span></div></div>
                </article>
              ))}
          </div>
          {!reports.isLoading && reports.data?.length === 0 && <div className="mt-12 border border-dashed border-ink/20 py-24 text-center"><FileText className="mx-auto size-9 text-gold-dark" /><p className="mt-5 font-serif text-2xl">第一則深度報導正在審核中</p><p className="mt-3 text-sm text-muted-foreground">我們寧可延後，也不發布缺少證據的文章。</p></div>}
        </section>
      </main>
    </PublicLayout>
  );
}
