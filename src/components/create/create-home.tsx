"use client";

import { Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import { Button } from "@/components/ui/button";
import { cloneProject, starterProject } from "@/lib/pass/factory";
import { PURPOSES, STYLE_SPECS, type PurposeId } from "@/lib/pass/styles";
import { importProjectFile, saveDraft } from "@/lib/storage/drafts";
import { getTemplate } from "@/lib/templates";
import { MyPasses } from "./my-passes";

function PurposeCard({ id, onPick }: { id: PurposeId; onPick: (id: PurposeId) => void }) {
  const purpose = PURPOSES.find((p) => p.id === id)!;
  const project = useMemo(() => starterProject(id), [id]);
  return (
    <button
      type="button"
      aria-label={`${purpose.name}. ${purpose.blurb}`}
      onClick={() => onPick(id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div aria-hidden className="flex h-40 items-start justify-center overflow-hidden bg-muted/50 pt-5">
        <div className="transition-transform duration-300 group-hover:-translate-y-1">
          <WalletPassPreview project={project} scale={0.42} />
        </div>
      </div>
      <div className="space-y-0.5 border-t border-border/60 p-3.5">
        <div className="text-sm font-medium">{purpose.name}</div>
        <div className="text-xs text-muted-foreground">{purpose.blurb}</div>
        <div className="pt-1 text-[11px] text-muted-foreground/80">Uses {STYLE_SPECS[purpose.style].name}</div>
      </div>
    </button>
  );
}

export function CreateHome() {
  const router = useRouter();
  const params = useSearchParams();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const templateSlug = params.get("template");
  const purposeParam = params.get("purpose") as PurposeId | null;

  const openDraft = async (make: () => ReturnType<typeof starterProject>) => {
    const p = make();
    await saveDraft(p);
    router.push(`/create/${p.id}`);
  };

  useEffect(() => {
    if (templateSlug) {
      const t = getTemplate(templateSlug);
      if (t) openDraft(() => cloneProject(t.build(), { name: t.name }));
      else toast.error("That template doesn't exist.");
    } else if (purposeParam && PURPOSES.some((p) => p.id === purposeParam)) {
      openDraft(() => starterProject(purposeParam));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateSlug, purposeParam]);

  const validPurpose = purposeParam && PURPOSES.some((p) => p.id === purposeParam);
  if (busy || (templateSlug && getTemplate(templateSlug)) || validPurpose)
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground" aria-busy="true">Opening the editor…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">What are you creating?</h1>
          <p className="mt-2 text-muted-foreground">Pick a starting point. No account needed. Your designs stay in this browser.</p>
        </div>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <Upload /> Import project
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".walletpassproject,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              const id = await importProjectFile(f);
              toast.success("Project imported");
              router.push(`/create/${id}`);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Import failed");
            }
          }}
        />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PURPOSES.map((p) => (
          <PurposeCard key={p.id} id={p.id} onPick={(id) => {
            setBusy(true);
            openDraft(() => starterProject(id));
          }} />
        ))}
      </div>
      <MyPasses />
    </div>
  );
}
