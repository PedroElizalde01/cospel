"use client";

import { Copy, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { STYLE_SPECS } from "@/lib/pass/styles";
import type { DraftRow } from "@/lib/storage/db";
import { deleteDraft, duplicateDraft, exportProject, renameDraft, useDrafts } from "@/lib/storage/drafts";

const fmt = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
function ago(ts: number) {
  const m = Math.round((ts - Date.now()) / 60000);
  if (m > -1) return "just now";
  if (m > -60) return fmt.format(m, "minute");
  if (m > -1440) return fmt.format(Math.round(m / 60), "hour");
  return fmt.format(Math.round(m / 1440), "day");
}

function DraftCard({ row, onRename, onDelete }: { row: DraftRow; onRename: () => void; onDelete: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow hover:shadow-lg">
      <Link href={`/create/${row.id}`} className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" aria-label={`Open ${row.name}`}>
        <div className="flex h-44 items-start justify-center overflow-hidden bg-muted/50 pt-5">
          <WalletPassPreview project={row.project} scale={0.45} />
        </div>
        <div className="border-t border-border/60 p-3.5 pr-10">
          <div className="truncate text-sm font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">{STYLE_SPECS[row.style].name} · {ago(row.updatedAt)}</div>
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="absolute right-2 bottom-3" aria-label={`Actions for ${row.name}`}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onRename}><Pencil /> Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => duplicateDraft(row.id).then(() => toast.success("Duplicated"))}><Copy /> Duplicate</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportProject(row.project)}><Download /> Export JSON</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MyPasses() {
  const drafts = useDrafts();
  const [renaming, setRenaming] = useState<DraftRow | null>(null);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<DraftRow | null>(null);

  return (
    <section className="mt-16" aria-labelledby="my-passes">
      <div className="flex items-baseline justify-between">
        <h2 id="my-passes" className="text-lg font-semibold tracking-[-0.02em]">My passes</h2>
        <span className="text-xs text-muted-foreground">Saved in this browser</span>
      </div>
      {drafts === undefined ? (
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-muted/60" />
      ) : drafts.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing here yet. Your passes appear here automatically as you design them.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {drafts.map((d) => (
            <DraftCard
              key={d.id}
              row={d}
              onRename={() => {
                setName(d.name);
                setRenaming(d);
              }}
              onDelete={() => setDeleting(d)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename pass</DialogTitle></DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (renaming && name.trim()) await renameDraft(renaming.id, name.trim());
              setRenaming(null);
            }}
            className="space-y-4"
          >
            <Input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>This removes the design and its images from this browser. Export it first if you want a copy.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await deleteDraft(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
