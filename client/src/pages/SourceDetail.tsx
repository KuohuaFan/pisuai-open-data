import { useAuth } from "@/_core/hooks/useAuth";
import { RightsBadge, formatDate } from "@/components/DataPrimitives";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, Bookmark, ExternalLink, GitBranch, History, RadioTower, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function SourceDetail({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const source = trpc.sources.bySlug.useQuery({ slug });
  const toggle = trpc.member.toggleSource.useMutation();

  if (source.isLoading) return <PublicLayout><main className="container py-20"><Skeleton className="h-[520px] rounded-none" /></main></PublicLayout>;
  if (!source.data) return <PublicLayout><main className="container py-28 text-center"><h1 className="font-serif text-4xl">此來源不存在或尚未公開</h1><Button asChild className="mt-8 rounded-none"><Link href="/sources">返回資料庫</Link></Button></main></PublicLayout>;
  const item = source.data;
  const requiresPublicDataDisclaimer = ["智慧財產與專利訴訟", "公共衛生、醫療與環境", "公共監督與立法追蹤", "消費者保護與勞資爭議"].includes(item.category);

  return (
    <PublicLayout>
      <main>
        <section className="border-b border-ink/10 bg-paper-deep">
          <div className="container py-16">
            <Link href="/sources" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="size-4" />返回資料庫</Link>
            <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_330px]">
              <div><div className="flex flex-wrap gap-3"><RightsBadge value={item.rightsClass} /><span className="border border-ink/15 px-2 py-1 text-[10px] font-bold tracking-wide">{item.category}</span></div><h1 className="mt-7 max-w-4xl font-serif text-4xl font-semibold leading-tight text-ink sm:text-6xl">{item.name}</h1><p className="mt-5 text-lg text-ink/55">{item.provider}</p><p className="mt-8 max-w-3xl text-base leading-8 text-ink/70">{item.description}</p></div>
              <aside className="border-l-4 border-gold bg-navy p-7 text-white"><p className="font-mono text-[10px] tracking-[.22em] text-gold">GOVERNANCE CARD</p><dl className="mt-7 space-y-5 text-sm"><Meta label="取得方式" value={item.accessType} /><Meta label="更新節奏" value={item.updateCadence || "未明示"} /><Meta label="最後查核" value={formatDate(item.lastVerifiedAt)} /><Meta label="資料筆數" value={item.recordCount ? item.recordCount.toLocaleString() : "依上游查詢"} /></dl><Button className="mt-8 w-full rounded-none" variant="secondary" onClick={() => isAuthenticated ? toggle.mutate({ sourceId: item.id }) : startLogin()}><Bookmark className="mr-2 size-4" />{toggle.data?.bookmarked ? "已收藏" : "收藏來源"}</Button></aside>
            </div>
          </div>
        </section>

        <section className="container grid gap-12 py-16 lg:grid-cols-[1fr_330px]">
          <div className="space-y-12">
            <EvidenceBlock icon={ShieldAlert} title="授權判讀"><p>程式碼授權：<strong>{item.codeLicense || "未明示"}</strong></p><p>資料內容授權：<strong>{item.dataLicense || "待逐資產查核"}</strong></p><p className="mt-4 text-sm leading-7 text-ink/60">此分級是 PisuAI 的發布政策。GitHub repository 的授權不會自動延伸至其抓取、整理或連結的上游資料。</p></EvidenceBlock>
            <EvidenceBlock icon={History} title="風險與使用限制"><p className="leading-8">{item.riskNote || "尚無額外風險註記；使用前仍應核對上游當期條款與資料版本。"}</p></EvidenceBlock>
            <EvidenceBlock icon={RadioTower} title="顯名與來源"><p className="leading-8">{item.attribution || "公開使用時應標示資料提供機關、資料集名稱、版本或查核日期，並附原始來源連結。"}</p></EvidenceBlock>
          </div>
          <aside className="space-y-4">
            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="source-link"><span><small>CANONICAL SOURCE</small>原始資料來源</span><ExternalLink className="size-4" /></a>
            {item.repoUrl && <a href={item.repoUrl} target="_blank" rel="noreferrer" className="source-link"><span><small>GITHUB REPOSITORY</small>程式碼／資料專案</span><GitBranch className="size-4" /></a>}
            {item.commitSha && <div className="border border-ink/10 bg-paper-deep p-5"><p className="text-[10px] font-bold tracking-[.18em] text-muted-foreground">PINNED COMMIT</p><code className="mt-3 block break-all text-xs text-ink/70">{item.commitSha}</code></div>}
            {requiresPublicDataDisclaimer && <div className="border-l-4 border-gold bg-paper-deep p-5"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-gold-dark" /><p className="text-xs font-bold tracking-[.14em] text-ink">公開資料與法律聲明</p></div><p className="mt-3 text-xs leading-6 text-ink/62">本頁僅整理公開可得資訊、檢索範圍與使用限制，內容只供參考，不代表法律、醫療或個案意見，也不保證資料完全正確。請回查官方最新版本；使用者應自行評估目的、個資、名譽及其他風險並承擔使用責任。</p></div>}
          </aside>
        </section>
      </main>
    </PublicLayout>
  );
}

function Meta({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-4"><dt className="text-white/45">{label}</dt><dd className="text-right font-medium">{value}</dd></div>; }
function EvidenceBlock({ icon: Icon, title, children }: { icon: typeof ShieldAlert; title: string; children: React.ReactNode }) { return <section><div className="mb-5 flex items-center gap-3"><Icon className="size-5 text-gold-dark" /><h2 className="font-serif text-2xl font-semibold">{title}</h2></div><div className="border-l border-ink/15 pl-8 text-ink/72">{children}</div></section>; }
