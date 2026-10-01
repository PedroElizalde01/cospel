"use client";

import { Bus, Plane, Ship, TrainFront, ArrowRight } from "lucide-react";
import { useContext, type CSSProperties } from "react";
import { BARCODE_SPECS } from "@/lib/pass/barcode";
import type { PassField, PassProject } from "@/lib/pass/schema";
import { STYLE_SPECS, combinedRowMax, effectiveImages, visibleFields } from "@/lib/pass/styles";
import { cn } from "@/lib/utils";
import { BarcodeImage } from "./barcode-image";
import { AssetImg, FieldRow, FieldView, InteractionContext, PASS_FONT, PASS_H, PASS_W, POSTER_H, useColors } from "./pass-parts";

/** Fields to draw: Wallet-accurate by default, everything (marked) in sandbox mode. */
function useFaceFields(p: PassProject) {
  const { sandbox } = useContext(InteractionContext);
  const v = visibleFields(p);
  if (!sandbox) return v;
  const groups = STYLE_SPECS[p.style].groups;
  const all = (g: keyof PassProject["fields"]) => (groups[g] ? p.fields[g] : []);
  return { ...v, header: all("header"), primary: all("primary"), secondary: all("secondary"), auxiliary: all("auxiliary"), footer: all("footer") };
}

const SHAPES: Partial<Record<PassProject["style"], CSSProperties>> = {
  eventTicket: {
    maskImage: "radial-gradient(circle 15px at 50% 0, transparent 97%, #000 100%)",
    WebkitMaskImage: "radial-gradient(circle 15px at 50% 0, transparent 97%, #000 100%)",
  },
  boardingPass: {
    maskImage: "radial-gradient(circle 8px at 0 64px, transparent 96%, #000 100%), radial-gradient(circle 8px at 100% 64px, transparent 96%, #000 100%)",
    WebkitMaskImage: "radial-gradient(circle 8px at 0 64px, transparent 96%, #000 100%), radial-gradient(circle 8px at 100% 64px, transparent 96%, #000 100%)",
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  },
  coupon: {
    maskImage:
      "radial-gradient(circle 3.5px at 50% 0, transparent 95%, #000 100%), radial-gradient(circle 3.5px at 50% 100%, transparent 95%, #000 100%)",
    WebkitMaskImage:
      "radial-gradient(circle 3.5px at 50% 0, transparent 95%, #000 100%), radial-gradient(circle 3.5px at 50% 100%, transparent 95%, #000 100%)",
    maskSize: "11px 51%",
    WebkitMaskSize: "11px 51%",
    maskPosition: "top left, bottom left",
    WebkitMaskPosition: "top left, bottom left",
    maskRepeat: "repeat-x",
    WebkitMaskRepeat: "repeat-x",
  },
};

function Header({ p, fields, logoText = true }: { p: PassProject; fields: PassField[]; logoText?: boolean }) {
  const c = useColors(p);
  return (
    <div className="flex h-[54px] shrink-0 items-start justify-between gap-3 px-3 pt-2.5">
      <div className="flex h-[40px] min-w-0 items-center gap-2">
        <AssetImg asset={p.images.logo} className="h-full max-w-[150px] shrink-0 object-contain object-left" />
        {logoText && p.branding.logoText && (
          <span className="truncate text-[16px] leading-5 font-semibold tracking-[-0.01em]" style={{ color: c.fg }}>
            {p.branding.logoText}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-3">
        {fields.map((f) => (
          <FieldView key={f.id} field={f} p={p} align="right" valueClass="text-[16px] leading-5" className="max-w-[110px]" />
        ))}
      </div>
    </div>
  );
}

function BarcodeArea({ p }: { p: PassProject }) {
  const bc = p.barcode;
  if (!bc.enabled) return <div className="h-4" />;
  const square = BARCODE_SPECS[bc.format].shape === "square";
  return (
    <div className="flex shrink-0 justify-center px-3 pb-4">
      <div className="flex flex-col items-center rounded-[6px] bg-white p-2 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]">
        <BarcodeImage format={bc.format} message={bc.message} className={square ? "size-[118px]" : bc.format === "pdf417" ? "h-[62px] w-[236px]" : "h-[54px] w-[236px]"} />
        {bc.altText && <div className="mt-1 max-w-[236px] truncate text-[11px] leading-[13px] text-black">{bc.altText}</div>}
      </div>
    </div>
  );
}

const TRANSIT_ICON = { air: Plane, train: TrainFront, bus: Bus, boat: Ship, generic: ArrowRight };

function Body({ p }: { p: PassProject }) {
  const f = useFaceFields(p);
  const c = useColors(p);
  const img = effectiveImages(p);
  const combined = combinedRowMax(p) !== undefined;
  const rows = combined ? (
    <FieldRow fields={[...f.secondary, ...f.auxiliary]} p={p} className="mt-3" />
  ) : (
    <>
      <FieldRow fields={f.secondary} p={p} className="mt-3" />
      <FieldRow fields={f.auxiliary} p={p} className="mt-2.5" />
    </>
  );

  switch (p.style) {
    case "storeCard":
    case "coupon": {
      const primary = f.primary[0];
      return (
        <>
          <Header p={p} fields={f.header} />
          <div className="relative mt-1 h-[123px] shrink-0 overflow-hidden">
            <AssetImg asset={img.strip} className="absolute inset-0 size-full object-cover" />
            {primary && (
              <div className="absolute inset-x-0 bottom-0 top-0 flex items-center px-3">
                <FieldView field={primary} p={p} valueFirst valueClass="text-[44px] leading-[48px] font-light tracking-[-0.02em]" labelClass="mt-0.5 text-[11px]" />
              </div>
            )}
          </div>
          {rows}
        </>
      );
    }
    case "eventTicket": {
      const primary = f.primary[0];
      if (img.strip)
        return (
          <>
            <Header p={p} fields={f.header} />
            <div className="relative mt-1 h-[84px] shrink-0 overflow-hidden">
              <AssetImg asset={img.strip} className="absolute inset-0 size-full object-cover" />
              {primary && (
                <div className="absolute inset-0 flex items-center px-3">
                  <FieldView field={primary} p={p} valueClass="text-[26px] leading-[30px] tracking-[-0.01em]" />
                </div>
              )}
            </div>
            {rows}
          </>
        );
      return (
        <>
          <Header p={p} fields={f.header} />
          <div className="mt-2 flex items-start gap-3 px-3">
            <div className="min-w-0 flex-1">
              {primary && <FieldView field={primary} p={p} wrap valueClass="text-[26px] leading-[31px] tracking-[-0.01em] line-clamp-2" />}
            </div>
            {img.thumbnail && <AssetImg asset={img.thumbnail} className="size-[78px] shrink-0 rounded-[4px] object-cover" />}
          </div>
          {rows}
        </>
      );
    }
    case "boardingPass": {
      const [from, to] = f.primary;
      const Icon = TRANSIT_ICON[p.transitType];
      return (
        <>
          <Header p={p} fields={f.header} />
          <div className="mt-3 flex items-end justify-between gap-2 px-3">
            {from ? <FieldView field={from} p={p} valueClass="text-[38px] leading-[42px] font-light" className="max-w-[44%]" /> : <span />}
            <Icon aria-hidden className="mb-2 size-6 shrink-0" style={{ color: c.label }} strokeWidth={1.75} />
            {to ? <FieldView field={to} p={p} align="right" valueClass="text-[38px] leading-[42px] font-light" className="max-w-[44%]" /> : <span />}
          </div>
          {f.primary.slice(2).map((x) => (
            <FieldView key={x.id} field={x} p={p} className="px-3" />
          ))}
          {rows}
        </>
      );
    }
    default: {
      // generic
      const primary = f.primary[0];
      return (
        <>
          <Header p={p} fields={f.header} />
          <div className="mt-2 flex items-start gap-3 px-3">
            <div className="min-w-0 flex-1">
              {f.primary.map((x) => (
                <FieldView key={x.id} field={x} p={p} valueClass="text-[28px] leading-[33px] tracking-[-0.01em]" />
              ))}
              {!primary && <div className="h-[46px]" />}
            </div>
            {img.thumbnail && <AssetImg asset={img.thumbnail} className="size-[78px] shrink-0 rounded-[4px] object-cover" />}
          </div>
          {rows}
        </>
      );
    }
  }
}

function PosterFace({ p }: { p: PassProject }) {
  const f = useFaceFields(p);
  const c = useColors(p);
  const [title, ...rest] = f.primary;
  const footer = f.footer[0];
  const bc = p.barcode;
  return (
    <>
      <AssetImg asset={p.images.artwork} className="absolute inset-0 size-full object-cover" />
      <div className="relative flex items-start justify-between gap-3 px-4 pt-4">
        <AssetImg asset={p.images.logo} className="h-[30px] max-w-[126px] object-contain object-left" />
        {f.header.map((h) => (
          <FieldView key={h.id} field={h} p={p} align="right" valueClass="text-[15px] font-semibold" className="max-w-[140px]" />
        ))}
      </div>
      <div className="relative mt-auto space-y-2 px-4 pb-3">
        {title && (
          <FieldView
            field={title}
            p={p}
            wrap
            valueClass={cn("line-clamp-2", title.label ? "text-[22px] leading-[26px]" : "text-[30px] leading-[33px] font-bold tracking-[-0.02em]")}
          />
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {rest.map((x) => (
            <FieldView key={x.id} field={x} p={p} valueClass="text-[15px] font-medium" className="max-w-[45%]" />
          ))}
        </div>
      </div>
      <div
        className="relative flex h-[64px] shrink-0 items-center justify-between gap-3 px-4 backdrop-blur-xl"
        style={{ background: `color-mix(in srgb, ${c.bg} 55%, transparent)` }}
      >
        {footer ? <FieldView field={footer} p={p} valueClass="text-[15px] font-semibold" className="min-w-0 flex-1" /> : <span />}
        {bc.enabled && (
          <div className="rounded-[6px] bg-white p-1">
            <BarcodeImage format={bc.format} message={bc.message} className="size-[44px]" />
          </div>
        )}
      </div>
    </>
  );
}

/** The front of a pass at 1:1 point scale. */
export function PassFace({ p, className }: { p: PassProject; className?: string }) {
  const c = useColors(p);
  const img = effectiveImages(p);
  const poster = p.style === "posterGeneric";
  return (
    <div
      className={cn("relative flex flex-col overflow-hidden rounded-[13px] select-none", className)}
      style={{
        width: PASS_W,
        height: poster ? POSTER_H : PASS_H,
        background: c.bg,
        color: c.fg,
        fontFamily: PASS_FONT,
        ...SHAPES[p.style],
      }}
    >
      {p.style === "eventTicket" && img.background && (
        <>
          <AssetImg asset={img.background} className="absolute inset-0 size-full scale-125 object-cover blur-[14px]" />
          <div className="absolute inset-0" style={{ background: `color-mix(in srgb, ${c.bg} 25%, transparent)` }} />
        </>
      )}
      {poster ? (
        <PosterFace p={p} />
      ) : (
        <div className="relative flex h-full flex-col">
          <Body p={p} />
          <div className="min-h-2 flex-1" />
          {img.footer && (
            <div className="flex justify-center px-3 pb-2.5">
              <AssetImg asset={img.footer} className="h-[15px] w-[286px] object-contain" />
            </div>
          )}
          <BarcodeArea p={p} />
        </div>
      )}
    </div>
  );
}
