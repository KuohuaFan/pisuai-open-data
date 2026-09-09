import DashboardLayout from "@/components/DashboardLayout";
import { RightsBadge, formatDate } from "@/components/DataPrimitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Bookmark, BookOpen, Database } from "lucide-react";
import { Link } from "wouter";

export default function Library() {
  const library = trpc.member.library.useQuery();
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">MEMBER LIBRARY</p><h1 className="mt-4 font-serif text-4xl font-semibold">我的收藏</h1><p className="mt-3 text-sm text-muted-foreground">建立自己的研究入口；來源與報導更新時，收藏仍連回最新公開版本。</p>
        {library.isLoading ? <Skeleton className="mt-10 h-80 rounded-none" /> : <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="border border-ink/10 bg-paper"><div className="flex items-center justify-between border-b border-ink/10 p-6"><h2 className="flex items-center gap-3 font-serif text-2xl"><Database className="size-5 text-gold-dark" />資料來源</h2><span className="font-mono text-sm text-muted-foreground">{library.data?.savedSources.length ?? 0}</span></div><div className="divide-y divide-ink/10">{library.data?.savedSources.map(({ source, savedAt }) => <div key={source.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><Link href={`/sources/${source.slug}`} className="font-semibold leading-6 hover:text-gold-dark">{source.name}</Link><p className="mt-2 text-xs text-muted-foreground">{source.provider} · 收藏於 {formatDate(savedAt)}</p></div><RightsBadge value={source.rightsClass} /></div></div>)}</div>{!library.data?.savedSources.length && <Empty icon={Bookmark} copy="尚未收藏資料來源" href="/sources" />}</section>
          <section className="border border-ink/10 bg-paper"><div className="flex items-center justify-between border-b border-ink/10 p-6"><h2 className="flex items-center gap-3 font-serif text-2xl"><BookOpen className="size-5 text-gold-dark" />深度報導</h2><span className="font-mono text-sm text-muted-foreground">{library.data?.savedReports.length ?? 0}</span></div><div className="divide-y divide-ink/10">{library.data?.savedReports.map(({ report, savedAt }) => <Link key={report.id} href={`/reports/${report.slug}`} className="group block p-5"><p className="eyebrow">{report.topic}</p><h3 className="mt-3 font-serif text-xl font-semibold group-hover:text-gold-dark">{report.title}</h3><p className="mt-3 text-xs text-muted-foreground">{formatDate(savedAt)}<ArrowUpRight className="ml-2 inline size-3.5" /></p></Link>)}</div>{!library.data?.savedReports.length && <Empty icon={BookOpen} copy="尚未收藏深度報導" href="/reports" />}</section>
        </div>}
      </div>
    </DashboardLayout>
  );
}
function Empty({ icon: Icon, copy, href }: { icon: typeof Bookmark; copy: string; href: string }) { return <div className="grid place-items-center px-6 py-16 text-center"><Icon className="size-8 text-ink/20" /><p className="mt-4 text-sm text-muted-foreground">{copy}</p><Button asChild variant="outline" className="mt-5 rounded-none"><Link href={href}>前往探索</Link></Button></div>; }
