"use client";

import { Download, FileJson, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validateProject } from "@/lib/pass/validate";
import { exportProject } from "@/lib/storage/drafts";
import { toPassJson } from "@/lib/pass/mapper";
import { ValidationList } from "./right-panel";
import { useBuilder } from "./store";

/**
 * Preview mode works everywhere. Signed mode only when the server has a
 * signing identity; the private key never reaches the browser either way.
 */
export function GenerateDialog({ open, onOpenChange, signingAvailable }: { open: boolean; onOpenChange: (o: boolean) => void; signingAvailable: boolean }) {
  const p = useBuilder((s) => s.project!);
  const blocking = useMemo(
    () => validateProject(p, { mode: "generate", signing: { configured: signingAvailable } }).filter((i) => i.severity === "error"),
    [p, signingAvailable],
  );

  const downloadJson = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(toPassJson(p), null, 2)], { type: "application/json" }));
    a.download = "pass.json";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate pass</DialogTitle>
          <DialogDescription>
            {signingAvailable ? "Your design will be signed on the server and turned into a .pkpass file." : "You're in preview mode. Everything works except creating a signed .pkpass file."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 p-3">
            <div className="text-xs font-medium">Preview mode</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Free and unlimited. Realistic preview, saved in this browser, export and import designs.</p>
            <div className="mt-2 text-[11px] font-medium text-emerald-600">Active</div>
          </div>
          <div className="rounded-xl border border-border/70 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium"><ShieldCheck className="size-3.5" /> Signed pass mode</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Creates a real pass for Apple Wallet. Needs an Apple Pass Type ID certificate on the server.</p>
            <div className="mt-2 text-[11px] font-medium text-muted-foreground">{signingAvailable ? "Available" : "Not configured"}</div>
          </div>
        </div>
        {blocking.length > 0 && (
          <div className="rounded-xl border border-border/70">
            <div className="px-3 pt-2.5 text-xs font-medium">Fix before generating</div>
            <div onClick={() => onOpenChange(false)}><ValidationList issues={blocking} /></div>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={downloadJson}><FileJson /> Download pass.json</Button>
          <Button variant="outline" onClick={() => exportProject(p)}><Download /> Export project</Button>
          {signingAvailable && <Button disabled={blocking.length > 0}>Generate signed pass</Button>}
        </div>
        {!signingAvailable && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Setting up signing? See <a className="underline" href="/docs#certificates" target="_blank">Apple Wallet certificates</a>.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
