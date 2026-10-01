"use client";

import { toSVG } from "bwip-js/browser";
import { memo, useMemo } from "react";
import { BARCODE_SPECS } from "@/lib/pass/barcode";
import type { BarcodeFormat } from "@/lib/pass/schema";
import { cn } from "@/lib/utils";

/** Renders a barcode client-side. Returns null markup + error text when the message can't be encoded. */
export function useBarcodeSvg(format: BarcodeFormat, message: string) {
  return useMemo(() => {
    if (!message) return { svg: null, error: "No message" };
    const spec = BARCODE_SPECS[format];
    const invalid = spec.check?.(message);
    if (invalid) return { svg: null, error: invalid };
    try {
      const svg = toSVG({
        bcid: spec.bcid,
        text: message,
        scale: 3,
        ...(spec.shape === "wide" && format !== "pdf417" ? { height: 12 } : {}),
        ...(format === "pdf417" ? { columns: 4 } : {}),
        includetext: false,
      });
      return { svg, error: null };
    } catch (e) {
      return { svg: null, error: e instanceof Error ? e.message.replace(/^bwipp\.\w+#\d+: /, "") : "Can't encode" };
    }
  }, [format, message]);
}

export const BarcodeImage = memo(function BarcodeImage({
  format,
  message,
  className,
}: {
  format: BarcodeFormat;
  message: string;
  className?: string;
}) {
  const { svg, error } = useBarcodeSvg(format, message);
  if (!svg)
    return (
      <div className={cn("flex items-center justify-center bg-neutral-100 text-center text-[10px] leading-tight text-neutral-500", className)}>
        <span className="px-2">{error}</span>
      </div>
    );
  return (
    <div
      role="img"
      aria-label={`${BARCODE_SPECS[format].name}: ${message}`}
      className={cn("[&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
