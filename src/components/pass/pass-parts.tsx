"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { AssetRef, PassField, PassProject } from "@/lib/pass/schema";
import { useAssetUrl } from "@/lib/storage/drafts";
import { cn } from "@/lib/utils";

/** Base pass width in points. Wallet lays passes out at ~320 pt on compact iPhones. */
export const PASS_W = 320;
export const PASS_H = 418;
export const POSTER_H = 400;

export const PASS_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", var(--font-sans), system-ui, sans-serif';

export interface PreviewInteraction {
  selectedId?: string | null;
  onSelect?: (fieldId: string) => void;
  /** Sandbox mode: render fields Wallet would hide, clearly marked. */
  hidden?: Set<string>;
  sandbox?: boolean;
}

export const InteractionContext = createContext<PreviewInteraction>({});

export function useColors(p: PassProject) {
  const b = p.branding;
  return { bg: b.backgroundColor, fg: b.foregroundColor, label: b.labelColor };
}

export function AssetImg({ asset, className, style, alt = "" }: { asset?: AssetRef; className?: string; style?: CSSProperties; alt?: string }) {
  const url = useAssetUrl(asset);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} draggable={false} className={className} style={style} />;
}

type Align = "left" | "center" | "right";

function resolveAlign(f: PassField, fallback: Align): Align {
  return f.textAlignment === "natural" ? fallback : f.textAlignment;
}

/** A selectable field wrapper; outlines on hover/selection when the preview is interactive. */
export function Selectable({ field, children, className }: { field: PassField; children: ReactNode; className?: string }) {
  const { selectedId, onSelect, hidden, sandbox } = useContext(InteractionContext);
  const isHidden = hidden?.has(field.id);
  if (isHidden && !sandbox) return null;
  const selected = selectedId === field.id;
  if (!onSelect)
    return <div className={cn("min-w-0", className)}>{children}</div>;
  return (
    <div
      role="button"
      tabIndex={-1}
      data-field-id={field.id}
      title={isHidden ? "Not shown in Wallet" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
      className={cn(
        "relative min-w-0 cursor-pointer rounded-[4px] outline-offset-2 transition-[outline-color] duration-100",
        "outline outline-1 outline-transparent hover:outline-sky-400/70",
        selected && "outline-2 outline-sky-500 hover:outline-sky-500",
        isHidden && "opacity-50 outline-dashed outline-red-500/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldView({
  field,
  p,
  align = "left",
  valueClass,
  labelClass,
  valueFirst = false,
  wrap = false,
  className,
}: {
  field: PassField;
  p: PassProject;
  align?: Align;
  valueClass?: string;
  labelClass?: string;
  valueFirst?: boolean;
  /** Allow multi-line values instead of truncating. */
  wrap?: boolean;
  className?: string;
}) {
  const c = useColors(p);
  const a = resolveAlign(field, align);
  const label = field.label ? (
    <div
      className={cn("truncate text-[10px] leading-[13px] font-semibold tracking-[0.02em] uppercase", labelClass)}
      style={{ color: c.label }}
    >
      {field.label}
    </div>
  ) : null;
  const value = (
    <div className={cn(wrap ? "break-words" : "truncate", "text-[15px] leading-[19px]", valueClass)} style={{ color: c.fg }}>
      {field.value || " "}
    </div>
  );
  return (
    <Selectable field={field} className={className}>
      <div style={{ textAlign: a }}>
        {valueFirst ? (
          <>
            {value}
            {label}
          </>
        ) : (
          <>
            {label}
            {value}
          </>
        )}
      </div>
    </Selectable>
  );
}

/** A row of fields: first aligns left, last right, like Wallet distributes them. */
export function FieldRow({ fields, p, className, valueClass }: { fields: PassField[]; p: PassProject; className?: string; valueClass?: string }) {
  if (!fields.length) return null;
  return (
    <div className={cn("flex items-start justify-between gap-3 px-3", className)}>
      {fields.map((f, i) => (
        <FieldView
          key={f.id}
          field={f}
          p={p}
          valueClass={valueClass}
          align={i > 0 && i === fields.length - 1 ? "right" : "left"}
          className={cn("min-w-0", fields.length > 1 && "max-w-[50%]", fields.length === 1 && "flex-1")}
        />
      ))}
    </div>
  );
}
