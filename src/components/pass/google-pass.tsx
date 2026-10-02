"use client";

import { ChevronLeft, MoreVertical } from "lucide-react";
import { BARCODE_SPECS } from "@/lib/pass/barcode";
import { isDark } from "@/lib/pass/color";
import type { PassField, PassProject } from "@/lib/pass/schema";
import { visibleFields } from "@/lib/pass/styles";
import { cn } from "@/lib/utils";
import { BarcodeImage } from "./barcode-image";
import { AssetImg, Selectable } from "./pass-parts";

/**
 * Google Wallet rendering of the same PassProject (generic-pass layout):
 * circular logo + title, header, up to 3 rows of 2 fields, barcode, 5:4 hero image.
 * Source: Google Wallet generic pass template & brand guidelines.
 */
export const G_W = 340;
const ROW_H = 46;
const HERO_H = Math.round((G_W * 812) / 1032);
export const G_FONT = '"Google Sans", Roboto, var(--font-sans), system-ui, sans-serif';

export function googleLayout(p: PassProject) {
  const v = visibleFields(p);
  let header: { label: string; value: string; fields: PassField[] };
  let rest: PassField[];
  if (p.style === "boardingPass" && v.primary.length >= 2) {
    const [a, b] = v.primary;
    header = { label: `${a.label} → ${b.label}`, value: `${a.value} → ${b.value}`, fields: [a, b] };
    rest = [...v.header, ...v.primary.slice(2), ...v.secondary, ...v.auxiliary];
  } else if (v.primary[0]) {
    const [first, ...others] = v.primary;
    header = { label: first.label, value: first.value, fields: [first] };
    rest = [...v.header, ...others, ...v.secondary, ...v.auxiliary, ...v.footer];
  } else {
    header = { label: "", value: p.branding.logoText || p.branding.organizationName, fields: [] };
    rest = [...v.header, ...v.secondary, ...v.auxiliary, ...v.footer];
  }
  const rows: PassField[][] = [];
  for (let i = 0; i < rest.length && rows.length < 3; i += 2) rows.push(rest.slice(i, i + 2));
  const hero = p.images.strip ?? p.images.artwork ?? p.images.background;
  return { header, rows, overflow: rest.slice(6), hero };
}

export function googleCardHeight(p: PassProject) {
  const { rows, hero, header } = googleLayout(p);
  const bc = p.barcode.enabled ? (BARCODE_SPECS[p.barcode.format].shape === "square" ? 196 : 120) + (p.barcode.altText ? 18 : 0) : 0;
  return 72 + (header.label ? 18 : 0) + 34 + rows.length * ROW_H + 12 + bc + (hero ? HERO_H : 16);
}

const textColors = (bg: string) => (isDark(bg) ? { fg: "#ffffff", sub: "rgba(255,255,255,0.72)" } : { fg: "#1f1f1f", sub: "rgba(31,31,31,0.68)" });

function GField({ f, align = "left" }: { f: PassField; align?: "left" | "right" }) {
  return (
    <Selectable field={f} className="min-w-0 flex-1">
      <div style={{ textAlign: align }}>
        <div className="truncate text-[12px] leading-4 opacity-[0.72]">{f.label || " "}</div>
        <div className="truncate text-[16px] leading-[22px]">{f.value || " "}</div>
      </div>
    </Selectable>
  );
}

export function GooglePassFace({ p }: { p: PassProject }) {
  const bg = p.branding.backgroundColor;
  const c = textColors(bg);
  const { header, rows, hero } = googleLayout(p);
  const bc = p.barcode;
  const square = BARCODE_SPECS[bc.format].shape === "square";
  const logo = p.images.logo ?? p.images.icon;
  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] select-none" style={{ width: G_W, height: googleCardHeight(p), background: bg, color: c.fg, fontFamily: G_FONT }}>
      <div className="flex h-[72px] shrink-0 items-center gap-3 px-4">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/90">
          <AssetImg asset={logo} className="size-[70%] object-contain" />
        </div>
        <span className="truncate text-[15px] font-medium">{p.branding.organizationName || "Organization"}</span>
      </div>
      <div className="shrink-0 px-4">
        {header.fields.length === 1 ? (
          <Selectable field={header.fields[0]}>
            {header.label && <div className="truncate text-[13px] leading-[18px]" style={{ color: c.sub }}>{header.label}</div>}
            <div className="truncate text-[26px] leading-[34px]">{header.value || " "}</div>
          </Selectable>
        ) : (
          <>
            {header.label && <div className="truncate text-[13px] leading-[18px]" style={{ color: c.sub }}>{header.label}</div>}
            <div className="truncate text-[26px] leading-[34px]">{header.value}</div>
          </>
        )}
      </div>
      <div className="shrink-0 px-4 pt-3">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-4" style={{ height: ROW_H }}>
            {row.map((f, j) => <GField key={f.id} f={f} align={j === 1 ? "right" : "left"} />)}
          </div>
        ))}
      </div>
      <div className="h-3 shrink-0" />
      {bc.enabled && (
        <div className="flex shrink-0 flex-col items-center px-4 pb-4">
          <div className="rounded-[14px] bg-white p-3">
            <BarcodeImage format={bc.format} message={bc.message} className={square ? "size-[150px]" : bc.format === "pdf417" ? "h-[64px] w-[240px]" : "h-[60px] w-[240px]"} />
          </div>
          {bc.altText && <div className="mt-1.5 truncate text-[13px]" style={{ color: c.sub }}>{bc.altText}</div>}
        </div>
      )}
      {hero ? <AssetImg asset={hero} className="w-full shrink-0 object-cover" style={{ height: HERO_H }} /> : <div className="h-4" />}
    </div>
  );
}

export function GooglePassDetails({ p, dark }: { p: PassProject; dark: boolean }) {
  const { header, rows, overflow } = googleLayout(p);
  const all = [...header.fields, ...rows.flat(), ...overflow, ...p.fields.back];
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-[24px]", dark ? "bg-[#1f1f1f] text-white" : "bg-white text-[#1f1f1f]")} style={{ width: G_W, height: 560, fontFamily: G_FONT }}>
      <div className="flex items-center justify-between px-3 py-3">
        <ChevronLeft className="size-5" />
        <span className="text-[16px] font-medium">Pass details</span>
        <MoreVertical className="size-5" />
      </div>
      <div className="flex-1 divide-y overflow-y-auto px-4" style={{ borderColor: dark ? "#3c3c3c" : "#e3e3e3" }}>
        {all.map((f) => (
          <Selectable key={f.id} field={f}>
            <div className="py-3">
              <div className={cn("text-[13px]", dark ? "text-[#c4c4c4]" : "text-[#5f6368]")}>{f.label || f.key}</div>
              <div className="text-[15px] break-words whitespace-pre-wrap">{f.value}</div>
            </div>
          </Selectable>
        ))}
      </div>
    </div>
  );
}

export function AndroidContext({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-[44px] border-[10px] shadow-2xl", dark ? "border-neutral-800 bg-[#131314] text-white" : "border-neutral-300 bg-[#f8f9fa] text-[#1f1f1f]")}
      style={{ width: 372, height: 760, fontFamily: G_FONT }}
    >
      <div className="absolute top-3 left-1/2 size-3 -translate-x-1/2 rounded-full bg-black" />
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <span className="text-[22px]">Wallet</span>
        <span className="size-8 rounded-full bg-[#4285f4]/80" />
      </div>
      <div className="flex justify-center px-[6px]">{children}</div>
    </div>
  );
}
