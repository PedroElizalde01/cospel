"use client";

import { useMemo } from "react";
import { BARCODE_SPECS } from "@/lib/pass/barcode";
import type { PassProject } from "@/lib/pass/schema";
import { hiddenFieldIds, posterFallback, visibleFields } from "@/lib/pass/styles";
import { resolveProject } from "@/lib/pass/variables";
import { cn } from "@/lib/utils";
import { BarcodeImage } from "./barcode-image";
import { PassBackLegacy, PassDetailsSheet } from "./pass-details";
import { PassFace } from "./pass-face";
import { AssetImg, InteractionContext, PASS_FONT, PASS_H, PASS_W, POSTER_H, type PreviewInteraction } from "./pass-parts";

export type PreviewDevice = "iphone" | "watch" | "context";
export type PreviewSide = "front" | "details";
export type WalletVersion = "latest" | "legacy";

export interface WalletPassPreviewProps {
  project: PassProject;
  device?: PreviewDevice;
  side?: PreviewSide;
  wallet?: WalletVersion;
  /** Surrounding device UI theme. Never changes the pass's own colors. */
  surround?: "light" | "dark";
  scale?: number;
  interaction?: Omit<PreviewInteraction, "hidden">;
  className?: string;
}

/** Natural (unscaled) size of what the preview renders, for fit-to-container math. */
export function previewSize(p: PassProject, device: PreviewDevice = "iphone", side: PreviewSide = "front") {
  if (device === "watch") return { width: 232, height: 280 };
  if (device === "context") return { width: 372, height: 760 };
  if (side === "details") return { width: PASS_W, height: PASS_H + 60 };
  return { width: PASS_W, height: p.style === "posterGeneric" ? POSTER_H : PASS_H };
}

function WatchPreview({ p }: { p: PassProject }) {
  const v = visibleFields(p);
  const b = p.branding;
  const bc = p.barcode;
  const watchCode = bc.enabled && BARCODE_SPECS[bc.format].watch;
  const rest = [...v.secondary, ...v.auxiliary, ...v.footer];
  return (
    <div className="rounded-[52px] bg-gradient-to-b from-neutral-700 to-neutral-900 p-[10px] shadow-2xl" style={{ width: 232, height: 280 }}>
      <div className="size-full overflow-hidden rounded-[42px] bg-black p-[10px]" style={{ fontFamily: PASS_FONT }}>
        <div className="h-full space-y-2 overflow-y-auto [scrollbar-width:none]">
          <div className="rounded-[18px] p-3" style={{ background: b.backgroundColor, color: b.foregroundColor }}>
            <div className="flex items-center gap-1.5">
              <AssetImg asset={p.images.logo} className="h-4 max-w-[60px] object-contain" />
              <span className="truncate text-[12px] font-semibold">{b.logoText || b.organizationName}</span>
            </div>
            {v.primary.slice(0, 2).map((f) => (
              <div key={f.id} className="mt-2">
                <div className="text-[9px] font-semibold uppercase" style={{ color: b.labelColor }}>{f.label}</div>
                <div className="truncate text-[18px] leading-[22px]">{f.value}</div>
              </div>
            ))}
          </div>
          {rest.map((f) => (
            <div key={f.id} className="px-2 text-white">
              <div className="text-[10px] text-neutral-400 uppercase">{f.label}</div>
              <div className="truncate text-[14px]">{f.value}</div>
            </div>
          ))}
          {bc.enabled &&
            (watchCode ? (
              <div className="mx-auto w-fit rounded-[10px] bg-white p-2">
                <BarcodeImage format={bc.format} message={bc.message} className={BARCODE_SPECS[bc.format].shape === "square" ? "size-[110px]" : "h-[50px] w-[160px]"} />
              </div>
            ) : (
              <p className="px-2 text-[11px] text-neutral-400">{BARCODE_SPECS[bc.format].name} isn&apos;t shown on Apple Watch.</p>
            ))}
        </div>
      </div>
    </div>
  );
}

function WalletContext({ p, dark, children }: { p: PassProject; dark: boolean; children: React.ReactNode }) {
  const stack = ["#2f6f4f", "#d9d4cc", "#1d3557"];
  return (
    <div
      className={cn("relative overflow-hidden rounded-[56px] border-[10px] shadow-2xl", dark ? "border-neutral-800 bg-black text-white" : "border-neutral-300 bg-[#f2f2f7] text-black")}
      style={{ width: 372, height: 760, fontFamily: PASS_FONT }}
    >
      <div className="absolute top-3 left-1/2 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <div className="flex items-center justify-between px-6 pt-14 pb-3">
        <span className="text-[30px] font-bold tracking-[-0.02em]">Wallet</span>
        <span className="flex size-8 items-center justify-center rounded-full bg-[#0a84ff] text-[20px] leading-none text-white">+</span>
      </div>
      <div className="flex justify-center px-[16px]">{children}</div>
      <div className="absolute inset-x-[16px] bottom-[28px]">
        {stack.map((c, i) => (
          <div key={c} className="h-[46px] rounded-t-[13px] shadow-[0_-1px_3px_rgba(0,0,0,0.15)]" style={{ background: c, marginTop: i ? -34 : 0 }} />
        ))}
      </div>
      <span className="sr-only">Pass shown in a simulated Wallet screen for {p.branding.organizationName}</span>
    </div>
  );
}

/**
 * High-fidelity Apple Wallet pass simulation. Pure function of the PassProject:
 * the same data drives pass.json generation, so preview and real pass stay aligned.
 */
export function WalletPassPreview({
  project,
  device = "iphone",
  side = "front",
  wallet = "latest",
  surround = "light",
  scale = 1,
  interaction,
  className,
}: WalletPassPreviewProps) {
  // Legacy Wallet doesn't know posterGeneric: show the generic fallback it would render.
  // Sample values fill `{{variables}}`; legacy Wallet doesn't know posterGeneric and shows its generic fallback.
  const p = useMemo(() => {
    const resolved = resolveProject(project);
    return wallet === "legacy" && resolved.style === "posterGeneric" ? posterFallback(resolved) : resolved;
  }, [project, wallet]);
  const hidden = useMemo(() => hiddenFieldIds(p), [p]);
  const size = previewSize(p, device, side);
  const dark = surround === "dark";

  let content: React.ReactNode;
  if (device === "watch") content = <WatchPreview p={p} />;
  else {
    const card =
      side === "details" ? (
        wallet === "legacy" ? <PassBackLegacy p={p} /> : <PassDetailsSheet p={p} dark={dark} />
      ) : (
        <div style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08)) drop-shadow(0 12px 28px rgba(0,0,0,0.18))" }}>
          <PassFace p={p} />
        </div>
      );
    content = device === "context" ? <WalletContext p={p} dark={dark}>{card}</WalletContext> : card;
  }

  return (
    <InteractionContext.Provider value={{ ...interaction, hidden }}>
      <div className={cn("relative shrink-0", className)} style={{ width: size.width * scale, height: size.height * scale }}>
        <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})`, width: size.width, height: size.height }}>
          {content}
        </div>
      </div>
    </InteractionContext.Provider>
  );
}
