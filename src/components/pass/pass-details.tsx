"use client";

import { Fragment, useContext, type ReactNode } from "react";
import type { DataDetector, PassField, PassProject } from "@/lib/pass/schema";
import { cn } from "@/lib/utils";
import { AssetImg, FieldView, PASS_FONT, PASS_H, PASS_W, useColors, InteractionContext } from "./pass-parts";

const DETECTORS: { type: DataDetector; re: RegExp }[] = [
  { type: "link", re: /(https?:\/\/[^\s]+|www\.[^\s]+|[\w.+-]+@[\w-]+\.[\w.]+)/ },
  { type: "phone", re: /(\+?\d[\d\s().-]{6,}\d)/ },
];

/** Highlights what Wallet's data detectors would make tappable. */
function Linkified({ text, detectors }: { text: string; detectors: DataDetector[] }) {
  const active = DETECTORS.filter((d) => detectors.includes(d.type));
  if (!active.length) return <>{text}</>;
  const re = new RegExp(active.map((d) => d.re.source).join("|"), "g");
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    parts.push(text.slice(last, m.index));
    parts.push(
      <span key={m.index} className="text-[#0a84ff]">
        {m[0]}
      </span>,
    );
    last = m.index! + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts.map((x, i) => <Fragment key={i}>{x}</Fragment>)}</>;
}

function BackRow({ field, onSelect, selected, dark }: { field: PassField; onSelect?: (id: string) => void; selected: boolean; dark: boolean }) {
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={-1}
      onClick={onSelect ? () => onSelect(field.id) : undefined}
      className={cn(
        "px-4 py-2.5 outline-offset-[-2px]",
        onSelect && "cursor-pointer hover:outline hover:outline-1 hover:outline-sky-400/70",
        selected && "outline outline-2 outline-sky-500",
      )}
    >
      {field.label && <div className={cn("text-[13px] leading-[18px]", dark ? "text-[#98989f]" : "text-[#8a8a8e]")}>{field.label}</div>}
      <div className="text-[15px] leading-[20px] break-words whitespace-pre-wrap">
        <Linkified text={field.value || " "} detectors={field.dataDetectors} />
      </div>
    </div>
  );
}

function Toggle({ dark }: { dark: boolean }) {
  return (
    <span aria-hidden className="relative inline-block h-[20px] w-[34px] rounded-full bg-[#34c759]">
      <span className={cn("absolute top-[2px] right-[2px] size-[16px] rounded-full shadow", dark ? "bg-white" : "bg-white")} />
    </span>
  );
}

/** Modern (iOS 15+) pass details sheet. Follows the surrounding device theme, not pass colors. */
export function PassDetailsSheet({ p, dark }: { p: PassProject; dark: boolean }) {
  const { selectedId, onSelect } = useContext(InteractionContext);
  const cell = dark ? "bg-[#1c1c1e] divide-[#38383a]" : "bg-white divide-[#e5e5ea]";
  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-[13px] text-left", dark ? "bg-black text-white" : "bg-[#f2f2f7] text-black")}
      style={{ width: PASS_W, height: PASS_H + 60, fontFamily: PASS_FONT }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1 text-[15px]">
        <span className="text-[#0a84ff]">Done</span>
        <span className="font-semibold">Pass Details</span>
        <span className="w-9" />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-3 pt-2 pb-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-11 items-center justify-center overflow-hidden rounded-[10px]" style={{ background: p.branding.backgroundColor }}>
            <AssetImg asset={p.images.icon ?? p.images.logo} className="size-full object-contain p-1" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold">{p.branding.organizationName || "Organization"}</div>
            <div className={cn("text-[13px]", dark ? "text-[#98989f]" : "text-[#8a8a8e]")}>Updated just now</div>
          </div>
        </div>
        <div className={cn("divide-y overflow-hidden rounded-[10px]", cell)}>
          <div className="flex items-center justify-between px-4 py-2.5 text-[15px]">
            Automatic Updates <Toggle dark={dark} />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-[15px]">
            Allow Notifications <Toggle dark={dark} />
          </div>
        </div>
        {p.fields.back.length > 0 && (
          <div className={cn("divide-y overflow-hidden rounded-[10px]", cell)}>
            {p.fields.back.map((f) => (
              <BackRow key={f.id} field={f} onSelect={onSelect} selected={selectedId === f.id} dark={dark} />
            ))}
          </div>
        )}
        <div className={cn("overflow-hidden rounded-[10px] px-4 py-2.5 text-center text-[15px] text-[#ff3b30]", cell)}>Remove Pass</div>
      </div>
    </div>
  );
}

/** Pre-iOS 15 Wallet: details on the flipped back of the card, in pass colors. */
export function PassBackLegacy({ p }: { p: PassProject }) {
  const c = useColors(p);
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[13px]"
      style={{ width: PASS_W, height: PASS_H, background: c.bg, color: c.fg, fontFamily: PASS_FONT }}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2 text-[13px]">
        <span className="font-semibold opacity-80">{p.branding.organizationName}</span>
        <span className="font-semibold">Done</span>
      </div>
      <div className="mx-3 mb-3 flex-1 space-y-3 overflow-y-auto rounded-[8px] p-3" style={{ background: `color-mix(in srgb, ${c.fg} 8%, transparent)` }}>
        {p.fields.back.map((f) => (
          <FieldView key={f.id} field={f} p={p} wrap valueClass="text-[13px] leading-[17px] whitespace-pre-wrap" labelClass="normal-case text-[11px]" />
        ))}
        {!p.fields.back.length && <div className="text-[13px] opacity-60">No details yet.</div>}
      </div>
    </div>
  );
}
