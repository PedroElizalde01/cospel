"use client";

import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { PassProject } from "@/lib/pass/schema";
import { STYLE_SPECS } from "@/lib/pass/styles";
import { deletePass, duplicatePass } from "@/server/actions";

interface Item {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  project: PassProject;
}

export function PassGrid({ items }: { items: Item[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [, start] = useTransition();
  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow hover:shadow-lg">
            <Link href={`/studio/passes/${it.id}`} aria-label={`Open ${it.name}`} className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <div aria-hidden className="flex h-44 items-start justify-center overflow-hidden bg-muted/50 pt-5">
                <WalletPassPreview project={it.project} scale={0.45} />
              </div>
              <div className="border-t border-border/60 p-3.5 pr-10">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{it.name}</span>
                  {it.status !== "draft" && <Badge variant="secondary" className="text-[10px]">{it.status}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {STYLE_SPECS[it.project.style].name} · {new Date(it.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="absolute right-2 bottom-3" aria-label={`Actions for ${it.name}`}><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() =>
                    start(async () => {
                      const id = await duplicatePass(it.id);
                      toast.success("Duplicated");
                      router.push(`/studio/passes/${id}`);
                    })
                  }
                >
                  <Copy /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(it)}><Trash2 /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>This permanently deletes the pass design from your account.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && start(() => deletePass(deleting.id))}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
