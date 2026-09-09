import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, GitBranch, RadioTower } from "lucide-react";
import { Link } from "wouter";

export const rightsCopy = {
  A: { label: "A｜可公開再利用", className: "rights-a" },
  B: { label: "B｜僅索引與導流", className: "rights-b" },
  C: { label: "C｜限內部使用", className: "rights-c" },
  D: { label: "D｜另取授權", className: "rights-d" },
  MIXED: { label: "混合｜逐欄審查", className: "rights-mixed" },
} as const;

export function RightsBadge({ value }: { value: keyof typeof rightsCopy }) {
  const item = rightsCopy[value];
  return <Badge className={`rounded-none border px-2 py-1 text-[10px] font-bold tracking-wide ${item.className}`}>{item.label}</Badge>;
}

export function formatDate(value?: number | null) {
  if (!value) return "待確認";
  return new Date(value).toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric" });
}

export type SourceCardData = {
  id: number;
  slug: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  rightsClass: keyof typeof rightsCopy;
  accessType: string;
  repoUrl?: string | null;
  lastVerifiedAt?: number | null;
  featured: boolean;
};

export function SourceCard({ source }: { source: SourceCardData }) {
  return (
    <article className="group data-card flex h-full flex-col">
      <div className="mb-5 flex items-start justify-between gap-4">
        <RightsBadge value={source.rightsClass} />
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">#{String(source.id).padStart(4, "0")}</span>
      </div>
      <p className="eyebrow mb-3">{source.category}</p>
      <h3 className="font-serif text-[1.4rem] font-semibold leading-snug text-ink transition-colors group-hover:text-gold-dark">
        <Link href={`/sources/${source.slug}`}>{source.name}</Link>
      </h3>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{source.provider}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-7 text-ink/68">{source.description}</p>
      <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><RadioTower className="size-3.5" />{source.accessType}</span>
        <Link href={`/sources/${source.slug}`} className="inline-flex items-center gap-1 font-semibold text-ink hover:text-gold-dark">
          檢視證據 <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {source.repoUrl && <GitBranch className="pointer-events-none absolute bottom-5 right-5 size-16 text-ink/[0.025]" />}
    </article>
  );
}

export function SectionHeading({ kicker, title, copy }: { kicker: string; title: string; copy?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow mb-4">{kicker}</p>
      <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-5xl">{title}</h2>
      {copy && <p className="mt-5 max-w-2xl text-base leading-8 text-ink/65">{copy}</p>}
    </div>
  );
}
