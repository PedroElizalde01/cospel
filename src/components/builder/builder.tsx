"use client";

import { Barcode, CalendarClock, Layers, Palette, ScrollText, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { validateProject, type PanelId } from "@/lib/pass/validate";
import { duplicateDraft, getDraft, saveDraft } from "@/lib/storage/drafts";
import { cn } from "@/lib/utils";
import { GenerateDialog } from "./generate-dialog";
import { Onboarding } from "./onboarding";
import { BarcodePanel } from "./panels/barcode-panel";
import { ContentPanel } from "./panels/content-panel";
import { DesignPanel } from "./panels/design-panel";
import { DetailsPanel } from "./panels/details-panel";
import { RelevancePanel } from "./panels/relevance-panel";
import { SettingsPanel } from "./panels/settings-panel";
import { PreviewCanvas, PreviewToolbar } from "./preview-canvas";
import { PreviewOverlay } from "./preview-overlay";
import { RightPanel } from "./right-panel";
import { useBuilder } from "./store";
import { TopBar } from "./top-bar";

const PANELS: { id: PanelId; label: string; icon: typeof Layers; Component: () => React.ReactNode }[] = [
  { id: "content", label: "Content", icon: Layers, Component: ContentPanel },
  { id: "design", label: "Design", icon: Palette, Component: DesignPanel },
  { id: "barcode", label: "Barcode", icon: Barcode, Component: BarcodePanel },
  { id: "details", label: "Details", icon: ScrollText, Component: DetailsPanel },
  { id: "relevance", label: "Relevance", icon: CalendarClock, Component: RelevancePanel },
  { id: "settings", label: "Settings", icon: Settings2, Component: SettingsPanel },
];

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.getAttribute("role") === "textbox");

function useAutosave() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const { project, setSave } = useBuilder.getState();
    if (!project) return;
    try {
      await saveDraft(project);
      setSave("saved");
    } catch {
      setSave("error");
      toast.error("Couldn't save to this browser. Export your project to keep a copy.");
    }
  }, []);

  useEffect(() => {
    const unsub = useBuilder.subscribe((s, prev) => {
      if (!s.project || !prev.project || s.project === prev.project || s.project.id !== prev.project.id) return;
      if (s.save.state !== "saving") useBuilder.getState().setSave("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 400);
    });
    const onHide = () => document.visibilityState === "hidden" && timer.current && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      if (timer.current) flush();
    };
  }, [flush]);
  return flush;
}

function PanelNav({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const panel = useBuilder((s) => s.panel);
  const setPanel = useBuilder((s) => s.setPanel);
  return (
    <nav
      aria-label="Editor sections"
      className={cn(orientation === "vertical" ? "flex w-[60px] shrink-0 flex-col items-center gap-1 border-r border-border/60 py-2" : "flex gap-1 overflow-x-auto border-b border-border/60 px-2 py-1.5 [scrollbar-width:none]")}
    >
      {PANELS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setPanel(id)}
          aria-current={panel === id ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            orientation === "vertical" ? "w-[52px] flex-col gap-1 py-2 text-[10px]" : "gap-1.5 px-2.5 py-1.5 text-xs",
            panel === id && "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}

function ActivePanel() {
  const panel = useBuilder((s) => s.panel);
  const { Component } = PANELS.find((p) => p.id === panel)!;
  return <Component />;
}

export function Builder({ draftId, signingAvailable }: { draftId: string; signingAvailable: boolean }) {
  const router = useRouter();
  const project = useBuilder((s) => (s.project?.id === draftId ? s.project : null));
  const mobileTab = useBuilder((s) => s.mobileTab);
  const [missing, setMissing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const flush = useAutosave();

  useEffect(() => {
    let alive = true;
    getDraft(draftId).then((row) => {
      if (!alive) return;
      if (row) {
        useBuilder.getState().load(row.project);
        useBuilder.getState().setPreview({ surround: document.documentElement.classList.contains("dark") ? "dark" : "light" });
      }
      else setMissing(true);
    });
    return () => {
      alive = false;
    };
  }, [draftId]);

  const issues = useMemo(() => (project ? validateProject(project, { signing: { configured: signingAvailable } }) : []), [project, signingAvailable]);

  const duplicate = useCallback(async () => {
    await flush();
    const id = await duplicateDraft(draftId);
    if (id) {
      toast.success("Duplicated");
      router.push(`/create/${id}`);
    }
  }, [draftId, flush, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useBuilder.getState();
      const modKey = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (modKey && k === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (modKey && k === "y") {
        e.preventDefault();
        s.redo();
      } else if (modKey && k === "s") {
        e.preventDefault();
        flush().then(() => toast.success("Saved in this browser"));
      } else if (modKey && k === "d") {
        e.preventDefault();
        duplicate();
      } else if (!modKey && !e.altKey && !isEditable(e.target) && !document.querySelector("[role=dialog][data-state=open]")) {
        if (k === "p") setPreviewOpen((o) => !o);
        else if (k === "f") s.setPreview({ zoom: "fit" });
        else if (e.key === "Escape") s.select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush, duplicate]);

  if (missing)
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-lg font-semibold">This draft isn&apos;t in this browser</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Drafts are saved locally. It may have been deleted or created on another device.</p>
        <Button asChild><Link href="/create">Go to my passes</Link></Button>
      </div>
    );
  if (!project)
    return (
      <div className="flex h-dvh items-center justify-center" aria-busy="true">
        <div className="h-[418px] w-[320px] animate-pulse rounded-[13px] bg-muted" />
      </div>
    );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <TopBar onPreview={() => setPreviewOpen(true)} onGenerate={() => setGenerateOpen(true)} onInspector={() => setInspectorOpen(true)} onDuplicate={duplicate} />

      {/* Mobile: Edit / Preview tabs */}
      <div className="flex border-b border-border/60 md:hidden" role="tablist" aria-label="Editor view">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={mobileTab === t}
            onClick={() => useBuilder.getState().setMobileTab(t)}
            className={cn("flex-1 py-2 text-sm font-medium capitalize text-muted-foreground", mobileTab === t && "text-foreground shadow-[inset_0_-2px_0_currentColor]")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={cn("min-h-0 w-full flex-col md:flex md:w-auto md:flex-row", mobileTab === "edit" ? "flex" : "hidden")}>
          <div className="hidden md:flex"><PanelNav orientation="vertical" /></div>
          <div className="md:hidden"><PanelNav orientation="horizontal" /></div>
          <aside aria-label="Editor" data-onboarding="panel" className="min-h-0 flex-1 overflow-y-auto md:w-[320px] md:flex-none md:border-r md:border-border/60 lg:w-[340px]">
            <ActivePanel />
          </aside>
        </div>

        <main className={cn("min-h-0 min-w-0 flex-1 flex-col md:flex", mobileTab === "preview" ? "flex" : "hidden")}>
          <div className="flex shrink-0 justify-center border-b border-border/60 px-2 py-1.5">
            <PreviewToolbar />
          </div>
          <PreviewCanvas />
        </main>

        <aside aria-label="Inspector" className="hidden w-[300px] shrink-0 border-l border-border/60 xl:block">
          <RightPanel issues={issues} />
        </aside>
      </div>

      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent side="right" className="w-[320px] p-0 sm:max-w-[320px]">
          <SheetTitle className="sr-only">Inspector</SheetTitle>
          <RightPanel issues={issues} />
        </SheetContent>
      </Sheet>
      <PreviewOverlay open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <GenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} signingAvailable={signingAvailable} />
      <Onboarding />
    </div>
  );
}
