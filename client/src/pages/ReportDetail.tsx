import { useAuth } from "@/_core/hooks/useAuth";
import { RightsBadge, formatDate } from "@/components/DataPrimitives";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bookmark, Bot, ExternalLink, ShieldCheck } from "lucide-react";
import { Streamdown } from "streamdown";
import { Link } from "wouter";

export default function ReportDetail({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const report = trpc.reports.bySlug.useQuery({ slug });
  const toggle = trpc.member.toggleReport.useMutation();
  if (report.isLoading) return <PublicLayout><main className="container py-20"><Skeleton className="h-[620px] rounded-none" /></main></PublicLayout>;
  if (!report.data) return <PublicLayout><main className="container py-28 text-center"><h1 className="font-serif text-4xl">報導不存在或尚未公開</h1><Button asChild className="mt-8 rounded-none"><Link href="/reports">返回深度報導</Link></Button></main></PublicLayout>;
  const item = report.data;

  return (
    <PublicLayout>
      <main>
        <article>
          <header className="border-b border-ink/10 bg-paper-deep">
            <div className="container max-w-5xl py-16">
              <Link href="/reports" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="size-4" />返回深度報導</Link>
              <p className="eyebrow mt-12">{item.topic}</p>
              <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.08] text-ink sm:text-6xl">{item.title}</h1>
              <p className="mt-7 max-w-3xl text-xl leading-9 text-ink/62">{item.dek}</p>
              <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-ink/10 pt-6 text-xs text-muted-foreground">
                <span>{formatDate(item.publishedAt)} · {item.readingMinutes} 分鐘閱讀 · {item.sourceCount} 個引用來源</span>
                <Button variant="outline" className="rounded-none" onClick={() => isAuthenticated ? toggle.mutate({ reportId: item.id }) : startLogin()}><Bookmark className="mr-2 size-4" />{toggle.data?.bookmarked ? "已收藏" : "收藏報導"}</Button>
              </div>
            </div>
          </header>
          <div className="container grid max-w-6xl gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="article-body"><Streamdown>{item.body}</Streamdown></div>
            <aside className="space-y-6">
              <div className="border-l-4 border-jade bg-navy p-6 text-white"><ShieldCheck className="size-6 text-jade" /><h2 className="mt-5 font-serif text-xl font-semibold">發布透明度</h2><p className="mt-4 text-sm leading-7 text-white/60">本頁僅顯示已經人工核准的文章。AI 可協助草擬，但不能自行將內容公開。</p>{item.generatedBy === "ai-assisted" && <div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/45"><Bot className="mr-2 inline size-3.5" />AI 輔助 · {item.model || "模型未記錄"}</div>}</div>
              <div><p className="mb-4 text-xs font-bold tracking-[.18em] text-muted-foreground">引用來源</p><div className="space-y-3">{item.citations.map((citation, index) => <div key={citation.id} className="border border-ink/10 bg-paper p-4"><div className="flex items-start gap-3"><span className="font-mono text-xs text-gold-dark">[{index + 1}]</span><div><Link href={`/sources/${citation.slug}`} className="text-sm font-semibold leading-6 hover:text-gold-dark">{citation.name}</Link><p className="mt-1 text-xs text-muted-foreground">{citation.provider}</p><div className="mt-3 flex items-center justify-between"><RightsBadge value={citation.rightsClass} /><a href={citation.evidenceUrl || citation.sourceUrl} target="_blank" rel="noreferrer" aria-label="開啟原始來源"><ExternalLink className="size-4 text-muted-foreground" /></a></div></div></div></div>)}</div></div>
            </aside>
          </div>
        </article>
      </main>
    </PublicLayout>
  );
}
