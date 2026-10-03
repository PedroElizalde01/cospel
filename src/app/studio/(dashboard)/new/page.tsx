import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import { starterProject } from "@/lib/pass/factory";
import { PURPOSES, STYLE_SPECS } from "@/lib/pass/styles";
import { TEMPLATES } from "@/lib/templates";
import { createPass } from "@/server/actions";

export const metadata: Metadata = { title: "New pass", robots: { index: false } };

function Card({ title, subtitle, note, preview, action }: { title: string; subtitle: string; note: string; preview: React.ReactNode; action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button type="submit" className="group w-full overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <div aria-hidden className="flex h-40 items-start justify-center overflow-hidden bg-muted/50 pt-5">{preview}</div>
        <div className="border-t border-border/60 p-3.5">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
          <div className="pt-1 text-[11px] text-muted-foreground/80">{note}</div>
        </div>
      </button>
    </form>
  );
}

export default function NewPassPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/studio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Passes</Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">What are you creating?</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PURPOSES.map((p) => (
          <Card
            key={p.id}
            title={p.name}
            subtitle={p.blurb}
            note={`Uses ${STYLE_SPECS[p.style].name}`}
            preview={<WalletPassPreview project={starterProject(p.id)} scale={0.42} />}
            action={createPass.bind(null, { purpose: p.id })}
          />
        ))}
      </div>
      <h2 className="mt-12 text-lg font-semibold tracking-[-0.02em]">Or start from a template</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TEMPLATES.map((t) => (
          <Card
            key={t.slug}
            title={t.name}
            subtitle={t.businessType}
            note={`Uses ${STYLE_SPECS[t.build().style].name}`}
            preview={<WalletPassPreview project={t.build()} scale={0.42} />}
            action={createPass.bind(null, { template: t.slug })}
          />
        ))}
      </div>
    </div>
  );
}
