"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WalletPassPreview, previewSize } from "@/components/pass/wallet-pass-preview";
import { PreviewToolbar } from "./preview-canvas";
import { useBuilder } from "./store";

/** Distraction-free presentation view (P). Good for showing a client. */
export function PreviewOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = useBuilder((s) => s.project);
  const pv = useBuilder((s) => s.preview);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!p) return null;
  const size = previewSize(p, pv.device, pv.side, pv.platform);
  const scale = typeof window === "undefined" ? 1 : Math.min((window.innerHeight - 160) / size.height, (window.innerWidth - 48) / size.width, 1.8);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Pass preview"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/90 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Button variant="ghost" size="icon" className="absolute top-3 right-3" aria-label="Close preview" onClick={onClose}><X /></Button>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()}>
            <WalletPassPreview project={p} device={pv.device} side={pv.side} wallet={pv.wallet} platform={pv.platform} surround={pv.surround} scale={scale} />
          </motion.div>
          <div onClick={(e) => e.stopPropagation()}><PreviewToolbar /></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
