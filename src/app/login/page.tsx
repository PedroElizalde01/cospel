import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/studio/auth-form";
import { Logo } from "@/components/site/logo";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = (await searchParams).next;
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/studio";
  if (await getSession()) redirect(safeNext);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label="Cospel home"><Logo className="text-lg" /></Link>
      <Suspense>
        <AuthForm next={safeNext} />
      </Suspense>
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Just trying it out? <Link href="/create" className="underline">Use the playground</Link>. No account needed.
      </p>
    </main>
  );
}
