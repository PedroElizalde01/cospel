"use client";

import { Crop, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ImageSlot } from "@/lib/pass/schema";
import { imageSpec } from "@/lib/pass/styles";
import { getAsset, putAsset, useAssetUrl } from "@/lib/storage/drafts";
import { cn } from "@/lib/utils";
import { AssetCropper } from "./asset-cropper";
import { useBuilder } from "./store";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

/** Decode before trusting: rejects files that claim to be images but aren't. */
async function readImage(file: File) {
  if (!ACCEPT.includes(file.type)) throw new Error("Use a PNG, JPEG or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 10 MB or smaller.");
  try {
    const bmp = await createImageBitmap(file);
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    return dims;
  } catch {
    throw new Error("This file couldn't be read as an image.");
  }
}

export function AssetSlot({ slot, disabledReason }: { slot: ImageSlot; disabledReason?: string }) {
  const style = useBuilder((s) => s.project!.style);
  const ref = useBuilder((s) => s.project!.images[slot]);
  const update = useBuilder((s) => s.update);
  const url = useAssetUrl(ref);
  const spec = imageSpec(slot, style);
  const input = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [originalId, setOriginalId] = useState<string | undefined>();
  const [dragOver, setDragOver] = useState(false);

  const accept = async (file: File) => {
    try {
      const dims = await readImage(file);
      const id = await putAsset(file, dims.width, dims.height);
      setOriginalId(id);
      setCropSrc(URL.createObjectURL(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const edit = async () => {
    if (!ref) return;
    if (ref.kind === "local" && ref.originalId) {
      const original = await getAsset(ref.originalId);
      if (original) {
        setOriginalId(ref.originalId);
        setCropSrc(URL.createObjectURL(original.blob));
        return;
      }
    }
    setOriginalId(ref.kind === "local" ? ref.id : undefined);
    setCropSrc(url ?? null);
  };

  return (
    <div
      id={`image-${slot}`}
      tabIndex={-1}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) accept(f);
      }}
      className={cn("flex items-center gap-3 rounded-lg border p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring", dragOver ? "border-accent-blue bg-accent-blue/5" : "border-border/70", disabledReason && "opacity-60")}
    >
      <button
        type="button"
        onClick={() => (url ? edit() : input.current?.click())}
        disabled={!!disabledReason}
        aria-label={url ? `Edit ${spec.label}` : `Upload ${spec.label}`}
        className="checkerboard flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="max-h-full max-w-full object-contain" /> : <ImagePlus className="size-4 text-neutral-400" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {spec.label}
          {spec.required && <span className="text-[10px] font-normal text-muted-foreground">required</span>}
        </div>
        <p className="truncate text-[11px] text-muted-foreground" title={disabledReason ?? spec.hint}>
          {disabledReason ?? `${spec.width}×${spec.height} pt · ${spec.width * 3}×${spec.height * 3} px`}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        {url ? (
          <>
            <Button variant="ghost" size="icon-sm" aria-label={`Crop ${spec.label}`} onClick={edit}><Crop /></Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${spec.label}`} onClick={() => update((d) => void delete d.images[slot])}><Trash2 /></Button>
          </>
        ) : (
          <Button variant="outline" size="sm" disabled={!!disabledReason} onClick={() => input.current?.click()}>Upload</Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) accept(f);
          e.target.value = "";
        }}
      />
      <AssetCropper
        key={cropSrc ?? "closed"}
        open={!!cropSrc}
        onOpenChange={(o) => !o && setCropSrc(null)}
        src={cropSrc}
        slot={slot}
        style={style}
        onSave={async ({ blob, width, height }) => {
          const id = await putAsset(blob, width, height);
          update((d) => {
            d.images[slot] = { kind: "local", id, originalId, width, height };
          });
        }}
      />
    </div>
  );
}
