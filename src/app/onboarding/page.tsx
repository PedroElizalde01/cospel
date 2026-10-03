import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace } from "@/server/actions";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Set up your business", robots: { index: false } };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  if (await db.workspaceMember.findFirst({ where: { userId: user.id } })) redirect("/studio");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <Logo className="text-lg" />
      <form action={createWorkspace} className="w-full max-w-sm space-y-5 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Hi {user.name.split(" ")[0]}, what&apos;s your business called?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your passes, customers and brand live here. You can change it later.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Business name</Label>
          <Input id="name" name="name" required maxLength={80} placeholder="North Coffee" autoFocus />
        </div>
        <Button type="submit" className="w-full">Continue</Button>
      </form>
    </main>
  );
}
