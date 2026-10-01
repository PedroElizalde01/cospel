"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import type { PassProject } from "@/lib/pass/schema";
import { STYLE_SPECS } from "@/lib/pass/styles";
import type { TemplateMeta } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  meta: TemplateMeta;
  project: PassProject;
}

export function TemplateCard({ item, href }: { item: GalleryItem; href: string }) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border/70 bg-card transition-all [content-visibility:auto] [contain-intrinsic-size:auto_320px] hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex h-56 items-start justify-center overflow-hidden bg-muted/50 pt-6">
        <div className="transition-transform duration-300 group-hover:-translate-y-1.5">
          <WalletPassPreview project={item.project} scale={0.6} />
        </div>
      </div>
      <div className="border-t border-border/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium">{item.meta.name}</div>
          <span className="text-[11px] text-muted-foreground">{STYLE_SPECS[item.project.style].name}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.meta.description}</p>
      </div>
    </Link>
  );
}

export function TemplateGallery({ items, categories }: { items: GalleryItem[]; categories: string[] }) {
  const [cat, setCat] = useState<string | null>(null);
  const shown = cat ? items.filter((i) => i.meta.category === cat) : items;
  return (
    <div>
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              cat === c ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c ?? "All"}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <TemplateCard key={i.meta.slug} item={i} href={`/templates/${i.meta.slug}`} />
        ))}
      </div>
    </div>
  );
}
