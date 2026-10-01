"use client";

import { RotateCcw, RotateCw } from "lucide-react";
import { useState } from "react";
import Cropper, { type Area, type Size } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ImageSlot, PassStyle } from "@/lib/pass/schema";
import { imageSpec } from "@/lib/pass/styles";
import { Segmented } from "./ui";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = src;
  });

/** Crops/rotates in the browser and returns a PNG. Final @1x/@2x/@3x files are rendered server-side. */
async function renderCrop(src: string, area: Area, rotation: number, maxW: number, maxH: number, fit: "exact" | "contain") {
  const image = await loadImage(src);
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  const rad = (rotation * Math.PI) / 180;
  const bw = Math.abs(Math.cos(rad)) * w + Math.abs(Math.sin(rad)) * h;
  const bh = Math.abs(Math.sin(rad)) * w + Math.abs(Math.cos(rad)) * h;
  const rotated = document.createElement("canvas");
  rotated.width = Math.round(bw);
  rotated.height = Math.round(bh);
  const rctx = rotated.getContext("2d")!;
  rctx.translate(bw / 2, bh / 2);
  rctx.rotate(rad);
  rctx.drawImage(image, -w / 2, -h / 2, w, h);

  // Never upscale: keep source pixels so "too small" warnings stay truthful.
  const scale = fit === "exact" ? Math.min(1, maxW / area.width) : Math.min(1, maxW / area.width, maxH / area.height);
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(area.width * scale));
  out.height = Math.max(1, Math.round(area.height * scale));
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height);
  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/png"));
  if (!blob) throw new Error("Could not process this image.");
  return { blob, width: out.width, height: out.height };
}

type AspectChoice = "original" | "square" | "wide";

export function AssetCropper({
  open,
  onOpenChange,
  src,
  slot,
  style,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  src: string | null;
  slot: ImageSlot;
  style: PassStyle;
  onSave: (out: { blob: Blob; width: number; height: number }) => Promise<void> | void;
}) {
  const spec = imageSpec(slot, style);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [cropSize, setCropSize] = useState<Size | null>(null);
  const [natural, setNatural] = useState(1);
  const [aspectChoice, setAspectChoice] = useState<AspectChoice>("original");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const aspect =
    spec.fit === "exact" ? spec.width / spec.height : aspectChoice === "square" ? 1 : aspectChoice === "wide" ? spec.width / spec.height : natural;
  const maxW = spec.width * 3;
  const maxH = spec.height * 3;
  const transparentHint = slot === "logo" || slot === "icon";

  const save = async () => {
    if (!src || !area) return;
    setBusy(true);
    try {
      await onSave(await renderCrop(src, area, rotation, maxW, maxH, spec.fit));
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit {spec.label.toLowerCase()}</DialogTitle>
          <DialogDescription>
            {spec.hint} Recommended: {maxW}×{maxH} px ({spec.width}×{spec.height} pt @3x).
          </DialogDescription>
        </DialogHeader>
        <div className={`relative h-72 overflow-hidden rounded-lg ${transparentHint ? "checkerboard" : "bg-neutral-900"}`}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              minZoom={0.5}
              maxZoom={5}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, px) => setArea(px)}
              onCropSizeChange={setCropSize}
              onMediaLoaded={(m) => setNatural(m.naturalWidth / m.naturalHeight)}
              style={{ containerStyle: { background: "transparent" } }}
            />
          )}
          {cropSize && (slot === "strip" || slot === "artwork") && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: cropSize.width, height: cropSize.height }}
            >
              {slot === "strip" ? (
                <div className="absolute inset-y-[18%] left-[4%] w-[58%] rounded border border-dashed border-white/80">
                  <span className="absolute -top-5 left-0 text-[10px] text-white drop-shadow">Primary text area</span>
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-0 h-[14%] border-t border-dashed border-white/80 bg-white/10">
                  <span className="absolute -top-5 left-1 text-[10px] text-white drop-shadow">Material strip & code</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="crop-zoom" className="text-xs">Zoom</Label>
            <input id="crop-zoom" type="range" min={0.5} max={5} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="crop-rotate" className="text-xs">Rotate</Label>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Rotate left 90°" onClick={() => setRotation((r) => r - 90)}><RotateCcw /></Button>
              <input id="crop-rotate" type="range" min={-180} max={180} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-foreground" />
              <Button variant="ghost" size="icon-sm" aria-label="Rotate right 90°" onClick={() => setRotation((r) => r + 90)}><RotateCw /></Button>
            </div>
          </div>
        </div>
        {spec.fit === "contain" && (
          <Segmented
            label="Crop shape"
            value={aspectChoice}
            onChange={setAspectChoice}
            options={[
              { value: "original", label: "Original" },
              { value: "square", label: "Square" },
              { value: "wide", label: "Wide" },
            ]}
          />
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={reset}>Reset</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={!area || busy}>{busy ? "Saving…" : "Apply"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
