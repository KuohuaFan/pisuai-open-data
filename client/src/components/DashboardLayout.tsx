import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { Bookmark, Database, ExternalLink, LayoutDashboard, LogOut, PanelLeft, ShieldCheck } from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const DEFAULT_WIDTH = 272;
const SIDEBAR_WIDTH_KEY = "pisuai-sidebar-width";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (saved) setSidebarWidth(Math.min(360, Math.max(220, Number(saved) || DEFAULT_WIDTH)));
  }, []);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="grid min-h-screen place-items-center bg-paper-deep p-6"><div className="max-w-md border border-ink/10 bg-paper p-9 text-center shadow-xl"><Database className="mx-auto size-9 text-gold-dark" /><h1 className="mt-6 font-serif text-3xl font-semibold">登入 PiSuAI 工作台</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">收藏資料來源、保存報導，或以管理者身分審核自動生成草稿。</p><Button className="mt-8 w-full rounded-none" onClick={() => startLogin()}>登入繼續</Button><Link href="/" className="mt-5 block text-sm text-muted-foreground">返回公開網站</Link></div></div>;

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardContent onResize={width => { setSidebarWidth(width); window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width)); }}>
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
}

function DashboardContent({ children, onResize }: { children: React.ReactNode; onResize: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [resizing, setResizing] = useState(false);
  const menu = [
    { icon: Bookmark, label: "我的收藏", path: "/library" },
    ...(user?.role === "admin" ? [{ icon: LayoutDashboard, label: "治理總覽", path: "/admin" }] : []),
  ];

  useEffect(() => {
    const move = (event: MouseEvent) => resizing && onResize(Math.min(360, Math.max(220, event.clientX)));
    const up = () => setResizing(false);
    if (resizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); }
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, [resizing, onResize]);

  return <>
    <div className="relative">
      <Sidebar collapsible="icon" className="border-r border-white/10 bg-navy text-white">
        <SidebarHeader className="h-20 justify-center border-b border-white/10 px-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center border border-gold/40 text-gold"><Database className="size-4" /></span><div className="group-data-[collapsible=icon]:hidden"><strong className="font-serif">PiSuAI 工作台</strong><p className="mt-1 text-[9px] tracking-[.18em] text-white/40">DATA GOVERNANCE</p></div></div></SidebarHeader>
        <SidebarContent className="pt-5"><SidebarMenu className="px-3">{menu.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 text-white/68 hover:bg-white/10 hover:text-white data-[active=true]:bg-gold data-[active=true]:text-navy"><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent>
        <SidebarFooter className="border-t border-white/10 p-3"><button onClick={() => logout()} className="flex w-full items-center gap-3 p-2 text-sm text-white/58 hover:text-white"><Avatar className="size-8 border border-white/15"><AvatarFallback className="bg-white/10 text-xs text-white">{user?.name?.[0] || "P"}</AvatarFallback></Avatar><span className="min-w-0 flex-1 truncate text-left group-data-[collapsible=icon]:hidden">{user?.name || user?.email || "會員"}</span><LogOut className="size-4 group-data-[collapsible=icon]:hidden" /></button></SidebarFooter>
      </Sidebar>
      <button aria-label="調整側欄寬度" onMouseDown={() => setResizing(true)} className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize hover:bg-gold/40" />
    </div>
    <SidebarInset className="bg-paper-deep"><header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink/10 bg-paper/90 px-4 backdrop-blur"><div className="flex items-center gap-3"><SidebarTrigger><PanelLeft className="size-4" /></SidebarTrigger><ShieldCheck className="size-4 text-jade-dark" /><span className="text-xs font-bold tracking-[.14em] text-muted-foreground">權利先行・人工發布</span></div><Button asChild variant="outline" size="sm" className="rounded-none"><Link href="/">公開網站<ExternalLink className="ml-2 size-3.5" /></Link></Button></header><main className="p-5 md:p-8">{children}</main></SidebarInset>
  </>;
}
