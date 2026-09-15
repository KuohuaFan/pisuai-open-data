import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, CalendarClock, Database, ExternalLink, FileText, Landmark, Scale } from "lucide-react";
import { Link } from "wouter";

function safeUrls(raw: string | null) {
  if (!raw) return [];
  const matches = raw.match(/https?:\/\/[^\s,;]+/g) ?? [];
  return Array.from(new Set(matches)).filter(value => {
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  }).slice(0, 8);
}

export default function GovernmentDatasetDetail({ datasetId }: { datasetId: string }) {
  const dataset = trpc.government.byId.useQuery({ datasetId });
  if (dataset.isLoading) return <PublicLayout><main className="container py-20"><Skeleton className="h-[650px] rounded-none" /></main></PublicLayout>;
  if (!dataset.data) return <PublicLayout><main className="container py-28 text-center"><h1 className="font-serif text-4xl">此政府資料集不存在或已下架</h1><Button asChild className="mt-8 rounded-none"><Link href="/government-data">返回政府資料全集</Link></Button></main></PublicLayout>;
  const item = dataset.data;
  const urls = safeUrls(item.downloadUrls);
  const relatedUrl = safeUrls(item.relatedUrl)[0];
  const officialPage = `https://data.gov.tw/dataset/${encodeURIComponent(item.datasetId)}`;

  return (
    <PublicLayout>
      <main>
        <section className="border-b border-ink/10 bg-paper-deep">
          <div className="container py-14 sm:py-16">
            <Link href="/government-data" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="size-4" />返回政府資料全集</Link>
            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
              <div>
                <div className="flex flex-wrap gap-3"><Badge className="rounded-none bg-navy text-white">政府資料 metadata</Badge><Badge variant="outline" className="rounded-none border-ink/15">{item.serviceCategory}</Badge></div>
                <h1 className="mt-7 max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">{item.title}</h1>
                <p className="mt-5 text-lg text-ink/55">{item.publisher}</p>
                <p className="mt-8 max-w-3xl whitespace-pre-line text-base leading-8 text-ink/70">{item.description || "官方未提供資料集說明。"}</p>
              </div>
              <aside className="border-l-4 border-gold bg-navy p-7 text-white">
                <p className="font-mono text-[10px] tracking-[.22em] text-gold">DATASET CARD</p>
                <dl className="mt-7 space-y-5 text-sm"><Meta label="資料集 ID" value={item.datasetId} /><Meta label="格式" value={item.formats || "未明示"} /><Meta label="更新頻率" value={item.updateFrequency || "未明示"} /><Meta label="最近更新" value={item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString("zh-TW") : "未明示"} /></dl>
                <Button asChild className="mt-8 w-full rounded-none" variant="secondary"><a href={officialPage} target="_blank" rel="noreferrer">前往官方資料頁<ExternalLink className="ml-2 size-4" /></a></Button>
              </aside>
            </div>
          </div>
        </section>

        <section className="container grid gap-12 py-14 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <Block icon={Scale} title="授權與費用"><p>授權：<strong>{item.license || "官方未明示"}</strong></p><p className="mt-2">費用：<strong>{item.cost || "官方未明示"}</strong></p></Block>
            <Block icon={FileText} title="主要欄位說明"><p className="whitespace-pre-line leading-8">{item.fieldDescription || "官方未提供欄位說明。"}</p></Block>
            <Block icon={CalendarClock} title="來源與更新"><p>上架日期：{item.issuedAt ? new Date(item.issuedAt).toLocaleString("zh-TW") : "未明示"}</p><p className="mt-2">詮釋資料更新：{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString("zh-TW") : "未明示"}</p><p className="mt-2">PiSuAI 最近觀測：{new Date(item.lastSeenAt).toLocaleString("zh-TW")}</p></Block>
            {item.notes && <Block icon={Database} title="官方備註"><p className="whitespace-pre-line leading-8">{item.notes}</p></Block>}
          </div>
          <aside className="space-y-4">
            <a href={officialPage} target="_blank" rel="noreferrer" className="source-link"><span><small>DATA.GOV.TW</small>官方資料集頁</span><ExternalLink className="size-4" /></a>
            {relatedUrl && <a href={relatedUrl} target="_blank" rel="noreferrer" className="source-link"><span><small>RELATED PAGE</small>相關官方頁面</span><ExternalLink className="size-4" /></a>}
            {urls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="source-link"><span><small>RESOURCE {String(index + 1).padStart(2, "0")}</small>資料資源連結</span><ExternalLink className="size-4" /></a>)}
            <div className="border-l-4 border-gold bg-paper-deep p-5"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-gold-dark" /><p className="text-xs font-bold tracking-[.14em]">使用前請核對</p></div><p className="mt-3 text-xs leading-6 text-ink/62">PiSuAI 僅同步官方 metadata 與連結。本頁只供參考，不保證資料正確、完整或可用，也不構成法律意見。請以官方最新內容為準，自行評估授權、個資、第三人權利與使用風險。</p></div>
          </aside>
        </section>
      </main>
    </PublicLayout>
  );
}

function Meta({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-4"><dt className="text-white/45">{label}</dt><dd className="max-w-[190px] break-words text-right font-medium">{value}</dd></div>; }
function Block({ icon: Icon, title, children }: { icon: typeof Landmark; title: string; children: React.ReactNode }) { return <section><div className="mb-5 flex items-center gap-3"><Icon className="size-5 text-gold-dark" /><h2 className="font-serif text-2xl font-semibold">{title}</h2></div><div className="border-l border-ink/15 pl-8 text-ink/72">{children}</div></section>; }
