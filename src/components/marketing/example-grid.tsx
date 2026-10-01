"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { PassProject } from "@/lib/pass/schema";
import { PassShowcase } from "./pass-showcase";

interface Example {
  business: string;
  brand: string;
  slug: string;
  story: string;
  project: PassProject;
}

export function ExampleGrid({ items }: { items: Example[] }) {
  const [open, setOpen] = useState<Example | null>(null);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((e) => (
          <button
            key={e.slug}
            type="button"
            onClick={() => setOpen(e)}
            className="group overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="flex h-52 items-start justify-center overflow-hidden pt-6" style={{ background: `color-mix(in srgb, ${e.project.branding.backgroundColor} 12%, var(--muted))` }}>
              <div className="transition-transform duration-300 group-hover:-translate-y-1.5">
                <WalletPassPreview project={e.project} scale={0.52} />
              </div>
            </div>
            <div className="border-t border-border/60 p-4">
              <div className="text-xs text-muted-foreground">{e.business}</div>
              <div className="font-medium">{e.brand}</div>
              <p className="mt-1 text-sm text-muted-foreground">{e.story}</p>
            </div>
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          {open && (
            <>
              <DialogTitle>{open.brand}</DialogTitle>
              <DialogDescription>{open.story}</DialogDescription>
              <div className="flex justify-center py-2">
                <PassShowcase project={open.project} scale={0.95} />
              </div>
              <Button asChild className="w-full">
                <Link href={`/create?template=${open.slug}`}>Use this design</Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
