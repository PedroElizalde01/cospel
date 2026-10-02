"use client";

import { useState } from "react";
import { Segmented } from "@/components/builder/ui";
import { WalletPassPreview, type WalletPlatform } from "@/components/pass/wallet-pass-preview";
import type { PassProject } from "@/lib/pass/schema";

/** Read-only preview with a Front / Details switch. */
export function PassShowcase({ project, scale = 1 }: { project: PassProject; scale?: number }) {
  const [side, setSide] = useState<"front" | "details">("front");
  const [platform, setPlatform] = useState<WalletPlatform>("apple");
  return (
    <div className="flex flex-col items-center gap-4">
      <WalletPassPreview project={project} side={side} platform={platform} scale={scale} />
      <div className="flex flex-wrap justify-center gap-2">
        <Segmented label="Platform" value={platform} onChange={setPlatform} options={[{ value: "apple", label: "Apple Wallet" }, { value: "google", label: "Google Wallet" }]} />
        <Segmented label="Pass side" value={side} onChange={setSide} options={[{ value: "front", label: "Front" }, { value: "details", label: "Details" }]} />
      </div>
    </div>
  );
}
