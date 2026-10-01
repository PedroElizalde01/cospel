"use client";

import { Pipette } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizeHex } from "@/lib/pass/color";
import { cn } from "@/lib/utils";

const RECENT_KEY = "cospel:recent-colors";
const CURATED = ["#ffffff", "#f4ede4", "#f3efe7", "#e5e5ea", "#8e8e93", "#1c1c1e", "#000000", "#0f2a4a", "#073b3a", "#1d3b2a", "#2a0d0b", "#e5372b", "#ff6a2b", "#e8c873", "#2563eb", "#7a3b4f"];

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function pushRecent(c: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([c, ...readRecent().filter((x) => x !== c)].slice(0, 8)));
  } catch {}
}

interface EyeDropperCtor {
  new (): { open: () => Promise<{ sRGBHex: string }> };
}

function Swatches({ colors, onPick, label }: { colors: string[]; onPick: (c: string) => void; label: string }) {
  if (!colors.length) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use ${c}`}
            title={c}
            onClick={() => onPick(c)}
            className="size-6 rounded-md border border-black/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-white/15"
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

export function ColorField({
  id,
  label,
  value,
  onChange,
  palette = [],
}: {
  id: string;
  label: string;
  value: string;
  onChange: (hex: string, commit?: boolean) => void;
  palette?: string[];
}) {
  const [text, setText] = useState(value);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }
  const EyeDropper = typeof window !== "undefined" ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;

  const pick = (c: string) => {
    onChange(c, true);
    pushRecent(c);
    setRecent(readRecent());
  };

  return (
    <div className="flex items-center gap-2">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setRecent(readRecent());
          else pushRecent(value);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${label}: ${value}. Open color picker`}
            className="size-8 shrink-0 rounded-lg border border-black/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-white/15"
            style={{ background: value }}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-3">
          <input
            type="color"
            aria-label={`${label} color wheel`}
            value={normalizeHex(value) ?? "#000000"}
            onChange={(e) => onChange(e.target.value, false)}
            className="h-28 w-full cursor-pointer rounded-md border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
          />
          {EyeDropper && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                try {
                  const r = await new EyeDropper().open();
                  const hex = normalizeHex(r.sRGBHex);
                  if (hex) pick(hex);
                } catch {}
              }}
            >
              <Pipette /> Pick from screen
            </Button>
          )}
          <Swatches label="Brand" colors={palette} onPick={pick} />
          <Swatches label="Recent" colors={recent} onPick={pick} />
          <Swatches label="Suggested" colors={CURATED} onPick={pick} />
        </PopoverContent>
      </Popover>
      <div className="relative flex-1">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">{label}</span>
        <Input
          id={id}
          aria-label={`${label} hex`}
          value={text}
          spellCheck={false}
          onChange={(e) => {
            setText(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex, false);
          }}
          onBlur={() => setText(value)}
          className={cn("h-8 pl-24 text-right font-mono text-xs uppercase", !normalizeHex(text) && "border-destructive")}
        />
      </div>
    </div>
  );
}

/** Dominant colors of an image (coarse quantization, skips transparent pixels). */
export async function extractPalette(src: string, count = 5): Promise<string[]> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = c.height = 40;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, 40, 40);
  const data = ctx.getImageData(0, 0, 40, 40).data;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = `${data[i] >> 5}-${data[i + 1] >> 5}-${data[i + 2] >> 5}`;
    const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bk.n++;
    bk.r += data[i];
    bk.g += data[i + 1];
    bk.b += data[i + 2];
    buckets.set(key, bk);
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map(({ n, r, g, b }) => "#" + [r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join(""));
}
