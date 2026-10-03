"use client";

import { CloudUpload, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { AssetRef } from "@/lib/pass/schema";
import { getAsset } from "@/lib/storage/drafts";
import { importPass } from "@/server/actions";
import { uploadImage } from "./persistence";
import { useBuilder } from "./store";

/** Moves a playground draft (and its local images) into the signed-in business account. */
export function SaveToAccount({ onBeforeSave }: { onBeforeSave: () => Promise<void> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const project = useBuilder.getState().project;
    if (!project) return;
    const { data } = await authClient.getSession();
    if (!data) {
      toast("Log in to save this pass to your account. Your draft stays in this browser.");
      router.push(`/login?next=${encodeURIComponent(`/create/${project.id}`)}`);
      return;
    }
    setBusy(true);
    try {
      await onBeforeSave();
      const copy = structuredClone(project);
      for (const [slot, ref] of Object.entries(copy.images) as [keyof typeof copy.images, AssetRef | undefined][]) {
        if (ref?.kind !== "local") continue;
        const row = await getAsset(ref.id);
        if (row) copy.images[slot] = await uploadImage(row.blob);
        else delete copy.images[slot];
      }
      const id = await importPass(copy);
      toast.success("Saved to your account");
      router.push(`/studio/passes/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't save to your account.";
      if (/business/i.test(msg)) router.push("/onboarding");
      else toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <CloudUpload />}
      <span className="hidden lg:inline">Save to my account</span>
    </Button>
  );
}
