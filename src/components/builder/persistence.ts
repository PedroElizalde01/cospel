"use client";

import { createContext, useContext } from "react";
import type { AssetRef, PassProject } from "@/lib/pass/schema";
import { duplicateDraft, getDraft, putAsset, saveDraft } from "@/lib/storage/drafts";
import { duplicatePass, getPass, savePass } from "@/server/actions";

/** Where the editor reads and writes: this browser (playground) or the business account (Studio). */
export interface Persistence {
  mode: "local" | "account";
  backHref: string;
  editorHref: (id: string) => string;
  load: (id: string) => Promise<PassProject | null>;
  save: (p: PassProject) => Promise<void>;
  duplicate: (id: string) => Promise<string | null | undefined>;
  /** Keeps the uncropped upload for re-cropping later. Local only. */
  storeOriginal?: (file: Blob, width: number, height: number) => Promise<string>;
  storeImage: (png: Blob, width: number, height: number, originalId?: string) => Promise<AssetRef>;
}

export const localPersistence: Persistence = {
  mode: "local",
  backHref: "/create",
  editorHref: (id) => `/create/${id}`,
  load: async (id) => (await getDraft(id))?.project ?? null,
  save: saveDraft,
  duplicate: duplicateDraft,
  storeOriginal: putAsset,
  storeImage: async (png, width, height, originalId) => ({ kind: "local", id: await putAsset(png, width, height), originalId, width, height }),
};

/** Uploads a processed PNG to the signed-in business. */
export async function uploadImage(png: Blob): Promise<AssetRef> {
  const body = new FormData();
  body.append("file", png, "image.png");
  const res = await fetch("/api/assets", { method: "POST", body });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return { kind: "url", url: json.url, width: json.width, height: json.height };
}

export const accountPersistence: Persistence = {
  mode: "account",
  backHref: "/studio",
  editorHref: (id) => `/studio/passes/${id}`,
  load: getPass,
  save: savePass,
  duplicate: duplicatePass,
  storeImage: (png) => uploadImage(png),
};

export const PersistenceContext = createContext<Persistence>(localPersistence);
export const usePersistence = () => useContext(PersistenceContext);
