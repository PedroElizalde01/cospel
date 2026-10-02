"use client";

import { Maximize, Moon, Smartphone, Sun, Watch, Wallet as WalletIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WalletPassPreview, previewSize } from "@/components/pass/wallet-pass-preview";
import { STYLE_SPECS } from "@/lib/pass/styles";
import { cn } from "@/lib/utils";
import { useBuilder } from "./store";
import { Segmented } from "./ui";

function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function PreviewToolbar() {
  const pv = useBuilder((s) => s.preview);
  const setPreview = useBuilder((s) => s.setPreview);
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="toolbar" aria-label="Preview options">
      <Segmented
        label="Platform"
        value={pv.platform}
        onChange={(platform) => setPreview({ platform, ...(platform === "google" && pv.device === "watch" ? { device: "iphone" as const } : {}) })}
        options={[
          { value: "apple", label: "Apple Wallet" },
          { value: "google", label: "Google Wallet" },
        ]}
      />
      <Segmented
        label="Device"
        value={pv.device}
        onChange={(device) => setPreview({ device })}
        options={[
          { value: "iphone", label: <><Smartphone /> <span className="hidden sm:inline">{pv.platform === "google" ? "Phone" : "iPhone"}</span></>, title: "Phone" },
          ...(pv.platform === "apple" ? [{ value: "watch" as const, label: <><Watch /> <span className="hidden sm:inline">Watch</span></>, title: "Apple Watch" }] : []),
          { value: "context", label: <><WalletIcon /> <span className="hidden sm:inline">In Wallet</span></>, title: "In a simulated Wallet screen" },
        ]}
      />
      <Segmented
        label="Side"
        value={pv.side}
        onChange={(side) => setPreview({ side })}
        options={[
          { value: "front", label: "Front" },
          { value: "details", label: "Details" },
        ]}
      />
      <Segmented
        label="Zoom"
        value={pv.zoom}
        onChange={(zoom) => setPreview({ zoom })}
        options={[
          { value: "actual", label: "Actual size", title: "1 point = 1 pixel" },
          { value: "fit", label: <><Maximize /> Fit</>, title: "Fit to canvas (F)" },
        ]}
      />
      {pv.platform === "apple" && <Segmented
        label="Wallet version"
        value={pv.wallet}
        onChange={(wallet) => setPreview({ wallet })}
        options={[
          { value: "latest", label: "Latest", title: "Latest Wallet" },
          { value: "legacy", label: "Legacy", title: "Older Wallet versions" },
        ]}
      />}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Surrounding UI: ${pv.surround}. Switch`}
            onClick={() => setPreview({ surround: pv.surround === "light" ? "dark" : "light" })}
          >
            {pv.surround === "light" ? <Sun /> : <Moon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Surrounding UI theme. Pass colors never change.</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function PreviewCanvas({ className }: { className?: string }) {
  const p = useBuilder((s) => s.project!);
  const pv = useBuilder((s) => s.preview);
  const accuracy = useBuilder((s) => s.accuracy);
  const selectedId = useBuilder((s) => s.selectedFieldId);
  const select = useBuilder((s) => s.select);
  const [ref, box] = useContainerSize<HTMLDivElement>();
  const natural = previewSize(p, pv.device, pv.side, pv.platform);
  const fit = Math.min((box.width - 48) / natural.width, (box.height - 48) / natural.height, pv.device === "context" ? 1.2 : 1.6);
  const scale = pv.zoom === "actual" ? 1 : Math.max(0.3, fit || 1);
  const dark = pv.surround === "dark";

  return (
    <div
      ref={ref}
      onClick={() => select(null)}
      className={cn("relative min-h-0 flex-1 overflow-auto", className)}
      style={{
        backgroundColor: dark ? "#0b0b0d" : "#f3f3f5",
        backgroundImage: `radial-gradient(${dark ? "#26262b" : "#d9d9de"} 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }}
      data-onboarding="preview"
    >
      <div className="flex min-h-full min-w-full items-center justify-center p-6">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${pv.platform}-${p.style}-${pv.device}-${pv.side}-${pv.wallet}`}
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.6 }}
          >
            <WalletPassPreview
              project={p}
              device={pv.device}
              side={pv.side}
              wallet={pv.wallet}
              platform={pv.platform}
              surround={pv.surround}
              scale={scale}
              interaction={{ selectedId, onSelect: select, sandbox: !accuracy }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={cn("pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-[11px]", dark ? "text-neutral-500" : "text-neutral-500")}>
        <span>{pv.platform === "google" ? "Google Wallet · generic layout" : STYLE_SPECS[p.style].name}</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">{Math.round(scale * 100)}%</span>
        {!accuracy && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-red-600">Sandbox</span>}
        {pv.platform === "apple" && p.style === "posterGeneric" && pv.wallet === "latest" && <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-700 dark:text-sky-400">iOS 27 layout, approximate</span>}
      </div>
    </div>
  );
}
