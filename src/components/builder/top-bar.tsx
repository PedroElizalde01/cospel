"use client";

import { ArrowLeft, Check, Copy, Download, Eye, FileJson, Loader2, MoreHorizontal, PanelRight, Redo2, Sparkles, Undo2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toPassJson } from "@/lib/pass/mapper";
import { exportProject } from "@/lib/storage/drafts";
import { cn } from "@/lib/utils";
import { useBuilder } from "./store";

const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

function relative(at: number | null) {
  if (!at) return "";
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

function SaveStatus() {
  const save = useBuilder((s) => s.save);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, []);
  const label = save.state === "saving" ? "Saving…" : save.state === "error" ? "Not saved" : `Saved ${relative(save.at)}`;
  return (
    <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" role="status" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={save.state} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.15 }} className="flex items-center gap-1.5">
          {save.state === "saving" ? <Loader2 className="size-3 animate-spin" /> : save.state === "error" ? null : <Check className="size-3" />}
          <span className={cn(save.state === "error" && "text-destructive")}>{label}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function IconAction({ label, shortcut, onClick, disabled, children }: { label: string; shortcut?: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} disabled={disabled}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} {shortcut && <span className="ml-1 opacity-60">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

export function TopBar({ onPreview, onGenerate, onInspector, onDuplicate }: { onPreview: () => void; onGenerate: () => void; onInspector: () => void; onDuplicate: () => void }) {
  const name = useBuilder((s) => s.project!.name);
  const canUndo = useBuilder((s) => s.past.length > 0);
  const canRedo = useBuilder((s) => s.future.length > 0);
  const { undo, redo, update } = useBuilder.getState();

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border/60 bg-background px-2">
      <Button variant="ghost" size="icon-sm" asChild aria-label="Back to my passes">
        <Link href="/create"><ArrowLeft /></Link>
      </Button>
      <input
        aria-label="Pass name"
        value={name}
        onChange={(e) => update((d) => void (d.name = e.target.value), "name")}
        onBlur={(e) => !e.target.value.trim() && update((d) => void (d.name = "Untitled pass"))}
        className="h-8 w-36 min-w-0 rounded-md bg-transparent px-2 text-sm font-medium outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
      />
      <SaveStatus />
      <div className="ml-auto flex items-center gap-0.5">
        <IconAction label="Undo" shortcut={`${mod}Z`} onClick={undo} disabled={!canUndo}><Undo2 /></IconAction>
        <IconAction label="Redo" shortcut={`${mod}⇧Z`} onClick={redo} disabled={!canRedo}><Redo2 /></IconAction>
        <IconAction label="Preview" shortcut="P" onClick={onPreview}><Eye /></IconAction>
        <span className="xl:hidden">
          <IconAction label="Inspector & review" onClick={onInspector}><PanelRight /></IconAction>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Share and export"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => exportProject(useBuilder.getState().project!)}><Download /> Export project</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                navigator.clipboard.writeText(JSON.stringify(toPassJson(useBuilder.getState().project!), null, 2)).then(() => toast.success("Copied pass.json"))
              }
            >
              <FileJson /> Copy pass.json
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}><Copy /> Duplicate <span className="ml-auto text-xs opacity-60">{mod}D</span></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Share link · needs publishing</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" className="ml-1.5 h-8 px-3" onClick={onGenerate} data-onboarding="generate">
          <Sparkles /> <span className="hidden sm:inline">Generate pass</span><span className="sm:hidden">Generate</span>
        </Button>
      </div>
    </header>
  );
}
