"use client";

import Dexie, { type EntityTable } from "dexie";
import type { PassProject } from "@/lib/pass/schema";

export interface DraftRow {
  id: string;
  name: string;
  style: PassProject["style"];
  templateSlug?: string;
  createdAt: number;
  updatedAt: number;
  project: PassProject;
}

export interface AssetRow {
  id: string;
  blob: Blob;
  mime: string;
  width: number;
  height: number;
  createdAt: number;
}

/** Anonymous playground storage. Nothing here leaves the browser. */
export const db = new Dexie("cospel") as Dexie & {
  drafts: EntityTable<DraftRow, "id">;
  assets: EntityTable<AssetRow, "id">;
};

db.version(1).stores({
  drafts: "id, updatedAt",
  assets: "id",
});
