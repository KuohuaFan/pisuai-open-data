import { RightsBadge, SectionHeading, SourceCard, rightsCopy } from "@/components/DataPrimitives";
import PublicLayout from "@/components/PublicLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Database, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function Sources() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [rightsClass, setRightsClass] = useState("all");
  const input = useMemo(() => ({
    q: q || undefined,
    category: category === "all" ? undefined : category,
    rightsClass: rightsClass === "all" ? undefined : rightsClass as keyof typeof rightsCopy,
    limit: 100,
  }), [q, category, rightsClass]);
  const sources = trpc.sources.list.useQuery(input);
  const facets = trpc.sources.facets.useQuery();
  const sourceTotal = facets.data?.categories.reduce((sum, item) => sum + Number(item.total), 0) ?? 0;

  return (
    <PublicLayout>
      <main>
        <section className="border-b border-ink/10 bg-paper-deep">
          <div className="container py-20">
            <SectionHeading kicker="PUBLIC SOURCE REGISTRY" title="臺灣開放資料來源庫" copy="公開的是經過來源與權利初篩的索引；每個標籤代表 PisuAI 的使用政策，不取代個案法律判斷。" />
            <div className="mt-10 grid gap-5 border-l-4 border-jade bg-navy p-6 text-white md:grid-cols-[auto_1fr_auto] md:items-center">
              <span className="grid size-12 place-items-center border border-white/15 text-jade"><Database className="size-5" /></span>
              <div><p className="text-xs font-bold tracking-[.16em] text-jade">全國政府資料全集</p><p className="mt-2 text-sm leading-7 text-white/65">本頁 {sourceTotal || "—"} 筆是人工治理的來源卡；另有 5.3 萬筆以上中央與地方政府資料集 metadata 可全文搜尋。</p></div>
              <Link href="/government-data" className="inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">前往全集索引<ArrowRight className="size-4" /></Link>
            </div>
            <div className="mt-12 grid gap-3 border border-ink/10 bg-paper p-4 md:grid-cols-[1fr_240px_240px]">
              <label className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={event => setQ(event.target.value)} placeholder="搜尋來源、提供機關或說明…" className="h-12 rounded-none border-ink/15 bg-white pl-11" />
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-none border-ink/15 bg-white"><SelectValue placeholder="全部類別" /></SelectTrigger>
                <SelectContent><SelectItem value="all">全部類別</SelectItem>{facets.data?.categories.map(item => <SelectItem key={item.category} value={item.category}>{item.category}（{Number(item.total)}）</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rightsClass} onValueChange={setRightsClass}>
                <SelectTrigger className="h-12 rounded-none border-ink/15 bg-white"><SelectValue placeholder="全部權利分級" /></SelectTrigger>
                <SelectContent><SelectItem value="all">全部權利分級</SelectItem>{Object.entries(rightsCopy).map(([key, item]) => <SelectItem key={key} value={key}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><SlidersHorizontal className="size-4" />目前顯示 <strong className="text-ink">{sources.data?.length ?? 0}</strong> 筆公開來源</div>
          </div>
        </section>

        <section className="container py-16">
          {sources.isLoading ? (
            <div className="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-none" />)}</div>
          ) : sources.data?.length ? (
            <div className="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">{sources.data.map(source => <SourceCard key={source.id} source={source} />)}</div>
          ) : (
            <div className="border border-dashed border-ink/20 py-24 text-center"><p className="font-serif text-2xl">找不到符合條件的來源</p><p className="mt-3 text-sm text-muted-foreground">請清除部分篩選條件後再試一次。</p></div>
          )}
        </section>

        <section className="border-t border-ink/10 bg-paper-deep">
          <div className="container py-14">
            <p className="mb-5 text-xs font-bold tracking-[.18em] text-muted-foreground">權利分級速查</p>
            <div className="flex flex-wrap gap-3">{Object.entries(rightsCopy).map(([key]) => <RightsBadge key={key} value={key as keyof typeof rightsCopy} />)}</div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
