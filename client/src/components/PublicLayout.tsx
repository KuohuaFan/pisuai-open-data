import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Database, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const nav = [
  ["資料庫", "/sources"],
  ["深度報導", "/reports"],
  ["方法與授權", "/methodology"],
] as const;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="PiSuAI 首頁">
      <span className="relative grid size-10 place-items-center border border-gold/50 bg-gold/10 text-gold">
        <Database className="size-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
        <span className="absolute -right-1 -top-1 size-2 bg-jade" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-serif text-lg font-semibold tracking-wide text-ink">PiSuAI</span>
          <span className="mt-1 block text-[10px] font-semibold tracking-[0.28em] text-muted-foreground">貔貅智慧</span>
        </span>
      )}
    </Link>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between">
          <BrandMark />
          <nav className="hidden items-center gap-7 md:flex" aria-label="主要導覽">
            {nav.map(([label, path]) => (
              <Link
                key={path}
                href={path}
                className={`nav-link ${location.startsWith(path) ? "nav-link-active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {!loading && user ? (
              <>
                <Link href="/library" className="nav-link">我的收藏</Link>
                {user.role === "admin" && <Link href="/admin" className="nav-link">治理後台</Link>}
                <Button variant="outline" size="sm" onClick={() => logout()}>登出</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => startLogin()}>登入收藏</Button>
            )}
          </div>
          <button
            className="grid size-10 place-items-center border border-ink/15 md:hidden"
            aria-label={open ? "關閉選單" : "開啟選單"}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-ink/10 bg-paper px-5 py-5 md:hidden">
            <nav className="flex flex-col gap-4">
              {nav.map(([label, path]) => <Link key={path} href={path} onClick={() => setOpen(false)}>{label}</Link>)}
              {user && <Link href="/library" onClick={() => setOpen(false)}>我的收藏</Link>}
              {user?.role === "admin" && <Link href="/admin" onClick={() => setOpen(false)}>治理後台</Link>}
              {!user ? <Button onClick={() => startLogin()}>登入收藏</Button> : <Button variant="outline" onClick={() => logout()}>登出</Button>}
            </nav>
          </div>
        )}
      </header>
      {children}
      <footer className="border-t border-ink/10 bg-navy text-white">
        <div className="container grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-3"><BrandMark compact /><strong className="font-serif text-lg">PiSuAI｜貔貅智慧</strong></div>
            <p className="max-w-md text-sm leading-7 text-white/62">來源可追、版本可核、權利先行、錯誤可改。公開資料不是終點，而是可被驗證的知識起點。</p>
          </div>
          <div>
            <p className="footer-title">探索</p>
            <div className="space-y-3 text-sm text-white/68"><Link href="/sources">開放資料庫</Link><br /><Link href="/reports">深度報導</Link><br /><Link href="/methodology">治理方法</Link></div>
          </div>
          <div>
            <p className="footer-title">治理承諾</p>
            <p className="flex items-start gap-2 text-sm leading-6 text-white/68"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-jade" />所有公開內容均保留來源、權利分級與更正狀態；AI 草稿不得跳過人工發布。</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs tracking-wide text-white/45">© 2026 PiSuAI｜貔貅智慧 · 公開資料治理實驗</div>
      </footer>
    </div>
  );
}
