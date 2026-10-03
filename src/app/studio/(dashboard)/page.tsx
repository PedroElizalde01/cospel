import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PassGrid } from "@/components/studio/pass-grid";
import { Button } from "@/components/ui/button";
import { PassProjectSchema } from "@/lib/pass/schema";
import { db } from "@/server/db";
import { requireWorkspace } from "@/server/session";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };

export default async function StudioPage() {
  const { workspace } = await requireWorkspace();
  const passes = await db.pass.findMany({
    where: { workspaceId: workspace.id, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, status: true, updatedAt: true, design: true },
  });
  const items = passes.flatMap((p) => {
    const project = PassProjectSchema.safeParse(p.design);
    return project.success ? [{ id: p.id, name: p.name, status: p.status, updatedAt: p.updatedAt.toISOString(), project: project.data }] : [];
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Passes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length ? `${items.length} pass${items.length === 1 ? "" : "es"} in ${workspace.name}` : "Everything you design for your business lives here."}</p>
        </div>
        <Button asChild><Link href="/studio/new"><Plus /> New pass</Link></Button>
      </div>
      {items.length ? (
        <PassGrid items={items} />
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <h2 className="text-lg font-medium">Create your first Wallet pass</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Start from a template or a blank pass. It saves to your account automatically.</p>
          <Button asChild className="mt-6"><Link href="/studio/new"><Plus /> New pass</Link></Button>
          <p className="mt-6 text-xs text-muted-foreground">Already designed one in the playground? Open it there and use <strong>Save to my account</strong>.</p>
        </div>
      )}
    </div>
  );
}
