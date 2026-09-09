import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <PublicLayout>
      <main className="container grid min-h-[62vh] place-items-center py-20 text-center">
        <div><FileQuestion className="mx-auto size-10 text-gold-dark" /><p className="eyebrow mt-6">404 / NOT FOUND</p><h1 className="mt-5 font-serif text-4xl font-semibold sm:text-6xl">這筆資料不在公開層。</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground">頁面可能尚未公開、已被撤回，或網址已更新。請回到資料庫重新查找。</p><Button asChild className="mt-8 rounded-none"><Link href="/sources">返回資料庫</Link></Button></div>
      </main>
    </PublicLayout>
  );
}
