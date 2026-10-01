"use client";

import { liveQuery } from "dexie";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cloneProject } from "@/lib/pass/factory";
import { buildProjectFile, parseProjectFile, PROJECT_FILE_EXT, type EmbeddedAsset } from "@/lib/pass/project-file";
import { uid, type AssetRef, type PassProject } from "@/lib/pass/schema";
import { db, type DraftRow } from "./db";

export async function saveDraft(project: PassProject) {
  const now = Date.now();
  const existing = await db.drafts.get(project.id);
  const stamped = { ...project, metadata: { ...project.metadata, updatedAt: new Date(now).toISOString() } };
  await db.drafts.put({
    id: project.id,
    name: project.name,
    style: project.style,
    templateSlug: project.metadata.templateSlug,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    project: stamped,
  });
}

export const getDraft = (id: string) => db.drafts.get(id);

export function useDrafts(): DraftRow[] | undefined {
  const [rows, setRows] = useState<DraftRow[]>();
  useEffect(() => {
    const sub = liveQuery(() => db.drafts.orderBy("updatedAt").reverse().toArray()).subscribe({
      next: setRows,
      error: () => setRows([]),
    });
    return () => sub.unsubscribe();
  }, []);
  return rows;
}

export async function renameDraft(id: string, name: string) {
  const row = await db.drafts.get(id);
  if (!row) return;
  await saveDraft({ ...row.project, name });
}

export async function duplicateDraft(id: string) {
  const row = await db.drafts.get(id);
  if (!row) return;
  const copy = cloneProject(row.project, { name: `${row.project.name} copy` });
  await saveDraft(copy);
  return copy.id;
}

/** Deletes a draft and any image blobs no other draft references. */
export async function deleteDraft(id: string) {
  await db.transaction("rw", db.drafts, db.assets, async () => {
    await db.drafts.delete(id);
    const used = new Set<string>();
    await db.drafts.each((d) => {
      for (const ref of Object.values(d.project.images)) {
        if (ref?.kind === "local") {
          used.add(ref.id);
          if (ref.originalId) used.add(ref.originalId);
        }
      }
    });
    const orphans = (await db.assets.toCollection().primaryKeys()).filter((k) => !used.has(k));
    await db.assets.bulkDelete(orphans);
  });
}

// ---------- Assets ----------

const urlCache = new Map<string, string>();
const listeners = new Set<() => void>();
const pending = new Set<string>();
const notify = () => listeners.forEach((l) => l());

export async function putAsset(blob: Blob, width: number, height: number): Promise<string> {
  const id = uid();
  await db.assets.put({ id, blob, mime: blob.type, width, height, createdAt: Date.now() });
  // ponytail: object URLs live for the tab's lifetime; revoke on draft close if memory ever matters.
  urlCache.set(id, URL.createObjectURL(blob));
  notify();
  return id;
}

export const getAsset = (id: string) => db.assets.get(id);

function load(id: string) {
  if (urlCache.has(id) || pending.has(id)) return;
  pending.add(id);
  db.assets.get(id).then((row) => {
    pending.delete(id);
    if (row) {
      urlCache.set(id, URL.createObjectURL(row.blob));
      notify();
    }
  });
}

/** Resolves an asset reference to a displayable URL (object URL for local blobs). */
export function useAssetUrl(ref: AssetRef | undefined): string | undefined {
  const id = ref?.kind === "local" ? ref.id : undefined;
  const url = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (id ? urlCache.get(id) : undefined),
    () => undefined,
  );
  useEffect(() => {
    if (id) load(id);
  }, [id]);
  if (!ref) return undefined;
  return ref.kind === "url" ? ref.url : url;
}

// ---------- Export / import ----------

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export async function exportProject(project: PassProject) {
  const assets: Record<string, EmbeddedAsset> = {};
  for (const ref of Object.values(project.images)) {
    if (ref?.kind !== "local") continue;
    const row = await db.assets.get(ref.id);
    if (!row) continue;
    assets[ref.id] = { mime: row.mime as EmbeddedAsset["mime"], width: row.width, height: row.height, dataUrl: await blobToDataUrl(row.blob) };
  }
  // Originals stay local: exports carry only the processed images.
  const clean = structuredClone(project);
  for (const ref of Object.values(clean.images)) if (ref?.kind === "local") delete ref.originalId;
  const file = buildProjectFile(clean, assets);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${project.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "pass"}${PROJECT_FILE_EXT}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Imports a project file as a new local draft. Returns the new draft id. */
export async function importProjectFile(file: File): Promise<string> {
  if (file.size > 25 * 1024 * 1024) throw new Error("File is too large (max 25 MB).");
  const { project, assets } = parseProjectFile(await file.text());
  const idMap = new Map<string, string>();
  for (const [oldId, a] of Object.entries(assets)) {
    const blob = await (await fetch(a.dataUrl)).blob();
    idMap.set(oldId, await putAsset(blob, a.width, a.height));
  }
  const copy = cloneProject(project);
  for (const ref of Object.values(copy.images)) if (ref?.kind === "local") ref.id = idMap.get(ref.id)!;
  await saveDraft(copy);
  return copy.id;
}
