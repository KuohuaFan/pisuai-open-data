import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Building2, ChevronLeft, ChevronRight, Database, FileSearch, RefreshCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const PAGE_SIZE = 24;

export default function GovernmentDatasets() {
  const [q, setQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(q.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [q]);
  useEffect(() => setPage(1), [searchTerm, category]);
  const input = useMemo(() => ({
    q: searchTerm || undefined,
    category: category === "all" ? undefined : category,
    page,
    pageSize: PAGE_SIZE,
  }), [searchTerm, category, page]);
  const overview = trpc.government.overview.useQuery();
  const results = trpc.government.list.useQuery(input, { placeholderData: previous => previous });
  const totalPages = Math.max(1, Math.ceil((results.data?.total ?? 0) / PAGE_SIZE));

  return (
    <PublicLayout>
      <main>
        <section className="border-b border-ink/10 bg-paper-deep">
          <div className="container py-16 sm:py-20">
            <p className="eyebrow">NATIONAL GOVERNMENT DATA INDEX</p>
            <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-end">
              <div>
                <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">臺灣政府資料全集索引</h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-ink/65">同步政府資料開放平臺的中央與地方政府資料集 metadata。可搜尋資料名稱、提供機關、分類、格式及官方下載入口；原始檔仍由政府機關維護。</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-ink/10">
                <Stat icon={Database} value={Number(overview.data?.stats?.total ?? 0).toLocaleString()} label="現行資料集" />
                <Stat icon={Building2} value={Number(overview.data?.stats?.publishers ?? 0).toLocaleString()} label="提供機關標籤" />
              </div>
            </div>
            <div className="mt-10 border-l-4 border-gold bg-paper p-5 text-sm leading-7 text-ink/65">
              <strong className="text-ink">收錄邊界：</strong>本區是全國資料集目錄，不代表每筆內容都已完成 PiSuAI 個案法律審查，也不保證上游資料永久正確、完整或持續可用。實際使用前請核對原始資料、授權、個資與第三人權利。
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="grid gap-3 border border-ink/10 bg-paper p-4 md:grid-cols-[1fr_300px]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={event => setQ(event.target.value)} placeholder="搜尋資料集、機關、說明或資料集 ID…" className="h-12 rounded-none border-ink/15 bg-white pl-11" />
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-none border-ink/15 bg-white"><SelectValue placeholder="全部服務分類" /></SelectTrigger>
              <SelectContent><SelectItem value="all">全部服務分類</SelectItem>{overview.data?.categories.map(item => <SelectItem key={item.category} value={item.category}>{item.category}（{Number(item.total).toLocaleString()}）</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <span className="flex items-center gap-2"><FileSearch className="size-4" />符合條件 <strong className="text-ink">{Number(results.data?.total ?? 0).toLocaleString()}</strong> 筆</span>
            <span className="flex items-center gap-2"><RefreshCcw className="size-4" />最近同步：{overview.data?.lastSync?.finishedAt ? new Date(overview.data.lastSync.finishedAt).toLocaleString("zh-TW") : "準備中"}</span>
          </div>

          {results.isLoading && !results.data ? (
            <div className="mt-8 grid gap-px bg-ink/10 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 9 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-none" />)}</div>
          ) : results.data?.items.length ? (
            <div className={`mt-8 grid gap-px bg-ink/10 md:grid-cols-2 xl:grid-cols-3 ${results.isFetching ? "opacity-60" : ""}`}>
              {results.data.items.map(item => (
                <article key={item.datasetId} className="flex min-h-72 flex-col bg-paper p-6">
                  <div className="flex items-start justify-between gap-3"><Badge variant="outline" className="rounded-none border-ink/15 text-[10px]">{item.serviceCategory}</Badge><span className="font-mono text-[10px] text-muted-foreground">#{item.datasetId}</span></div>
                  <h2 className="mt-6 font-serif text-xl font-semibold leading-snug"><Link href={`/government-data/${item.datasetId}`} className="hover:text-gold-dark">{item.title}</Link></h2>
                  <p className="mt-3 text-xs font-semibold text-gold-dark">{item.publisher}</p>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-ink/58">{item.description || "官方未提供資料集說明。"}</p>
                  <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink/10 pt-5 text-xs text-muted-foreground"><span>{item.formats || "格式未明"}<br />{item.updateFrequency || "更新頻率未明"}</span><Link href={`/government-data/${item.datasetId}`} className="inline-flex items-center gap-1 font-semibold text-ink">查看 metadata <ArrowRight className="size-3" /></Link></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-ink/20 py-24 text-center"><p className="font-serif text-2xl">找不到符合條件的資料集</p><p className="mt-3 text-sm text-muted-foreground">請調整關鍵字或服務分類。</p></div>
          )}

          <div className="mt-10 flex items-center justify-center gap-4">
            <Button variant="outline" className="rounded-none" disabled={page <= 1 || results.isFetching} onClick={() => setPage(value => Math.max(1, value - 1))}><ChevronLeft className="mr-2 size-4" />上一頁</Button>
            <span className="min-w-32 text-center font-mono text-xs text-muted-foreground">{page.toLocaleString()} / {totalPages.toLocaleString()}</span>
            <Button variant="outline" className="rounded-none" disabled={page >= totalPages || results.isFetching} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>下一頁<ChevronRight className="ml-2 size-4" /></Button>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Database; value: string; label: string }) {
  return <div className="bg-navy p-5 text-white"><Icon className="size-5 text-jade" /><p className="mt-6 font-serif text-3xl font-semibold">{value || "—"}</p><p className="mt-1 text-xs tracking-wide text-white/50">{label}</p></div>;
}
