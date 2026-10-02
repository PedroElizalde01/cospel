"use client";

import { produce, type Draft } from "immer";
import { create } from "zustand";
import { field } from "@/lib/pass/factory";
import type { FieldGroup, PassField, PassProject } from "@/lib/pass/schema";
import type { PanelId } from "@/lib/pass/validate";
import type { PreviewDevice, PreviewSide, WalletPlatform, WalletVersion } from "@/components/pass/wallet-pass-preview";

const HISTORY_LIMIT = 100;
/** Keystrokes on the same control within this window collapse into one undo step. */
const COALESCE_MS = 800;

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface PreviewSettings {
  platform: WalletPlatform;
  device: PreviewDevice;
  side: PreviewSide;
  wallet: WalletVersion;
  zoom: "fit" | "actual";
  surround: "light" | "dark";
}

interface BuilderState {
  project: PassProject | null;
  past: PassProject[];
  future: PassProject[];
  lastEdit: { key: string; at: number } | null;
  save: { state: SaveState; at: number | null };
  selectedFieldId: string | null;
  panel: PanelId;
  preview: PreviewSettings;
  accuracy: boolean;
  mobileTab: "edit" | "preview";

  load: (p: PassProject) => void;
  /** Apply a change. Pass `coalesce` for continuous edits (typing, dragging a slider). */
  update: (recipe: (d: Draft<PassProject>) => void, coalesce?: string) => void;
  undo: () => void;
  redo: () => void;
  select: (fieldId: string | null) => void;
  setPanel: (panel: PanelId) => void;
  setPreview: (patch: Partial<PreviewSettings>) => void;
  setAccuracy: (on: boolean) => void;
  setMobileTab: (t: "edit" | "preview") => void;
  setSave: (state: SaveState) => void;

  addField: (group: FieldGroup, init?: Partial<PassField>) => string;
  updateField: (id: string, patch: Partial<PassField>, coalesce?: string) => void;
  removeField: (id: string) => void;
  duplicateField: (id: string) => void;
  moveField: (id: string, to: FieldGroup, index?: number) => void;
}

export function findField(p: PassProject, id: string): { group: FieldGroup; index: number; field: PassField } | null {
  for (const [group, list] of Object.entries(p.fields) as [FieldGroup, PassField[]][]) {
    const index = list.findIndex((f) => f.id === id);
    if (index >= 0) return { group, index, field: list[index] };
  }
  return null;
}

function uniqueKey(p: PassProject, base: string) {
  const keys = new Set(Object.values(p.fields).flat().map((f) => f.key));
  if (!keys.has(base)) return base;
  let i = 2;
  while (keys.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

export const useBuilder = create<BuilderState>()((set, get) => ({
  project: null,
  past: [],
  future: [],
  lastEdit: null,
  save: { state: "idle", at: null },
  selectedFieldId: null,
  panel: "content",
  preview: { platform: "apple", device: "iphone", side: "front", wallet: "latest", zoom: "fit", surround: "light" },
  accuracy: true,
  mobileTab: "edit",

  load: (p) => set({ project: p, past: [], future: [], lastEdit: null, selectedFieldId: null, save: { state: "saved", at: Date.now() } }),

  update: (recipe, coalesce) => {
    const { project, past, lastEdit } = get();
    if (!project) return;
    const next = produce(project, recipe);
    if (next === project) return;
    const now = Date.now();
    const merge = coalesce && lastEdit?.key === coalesce && now - lastEdit.at < COALESCE_MS;
    set({
      project: next,
      past: merge ? past : [...past.slice(-HISTORY_LIMIT + 1), project],
      future: [],
      lastEdit: coalesce ? { key: coalesce, at: now } : null,
    });
  },

  undo: () => {
    const { project, past, future } = get();
    if (!project || !past.length) return;
    set({ project: past[past.length - 1], past: past.slice(0, -1), future: [project, ...future], lastEdit: null });
  },
  redo: () => {
    const { project, past, future } = get();
    if (!project || !future.length) return;
    set({ project: future[0], past: [...past, project], future: future.slice(1), lastEdit: null });
  },

  select: (fieldId) => {
    const p = get().project;
    const loc = fieldId && p ? findField(p, fieldId) : null;
    set({ selectedFieldId: fieldId, ...(loc ? { panel: loc.group === "back" ? "details" : "content" } : {}) });
  },
  setPanel: (panel) => set({ panel }),
  setPreview: (patch) => set((s) => ({ preview: { ...s.preview, ...patch } })),
  setAccuracy: (accuracy) => set({ accuracy }),
  setMobileTab: (mobileTab) => set({ mobileTab }),
  setSave: (state) => set({ save: { state, at: state === "saved" ? Date.now() : get().save.at } }),

  addField: (group, init) => {
    const p = get().project!;
    const base = init?.key ?? (group === "back" ? "info" : group);
    const f = field({ label: group === "back" ? "Info" : "Label", value: group === "back" ? "" : "Value", ...init, key: uniqueKey(p, base) });
    get().update((d) => {
      d.fields[group].push(f);
    });
    set({ selectedFieldId: f.id });
    return f.id;
  },
  updateField: (id, patch, coalesce) =>
    get().update((d) => {
      const loc = findField(d as PassProject, id);
      if (loc) Object.assign(d.fields[loc.group][loc.index], patch);
    }, coalesce ? `${id}:${coalesce}` : undefined),
  removeField: (id) => {
    get().update((d) => {
      const loc = findField(d as PassProject, id);
      if (loc) d.fields[loc.group].splice(loc.index, 1);
    });
    if (get().selectedFieldId === id) set({ selectedFieldId: null });
  },
  duplicateField: (id) => {
    const p = get().project!;
    const loc = findField(p, id);
    if (!loc) return;
    const copy = field({ ...loc.field, key: uniqueKey(p, loc.field.key) });
    get().update((d) => {
      d.fields[loc.group].splice(loc.index + 1, 0, copy);
    });
    set({ selectedFieldId: copy.id });
  },
  moveField: (id, to, index) =>
    get().update((d) => {
      const loc = findField(d as PassProject, id);
      if (!loc) return;
      const [f] = d.fields[loc.group].splice(loc.index, 1);
      const list = d.fields[to];
      list.splice(index ?? list.length, 0, f);
    }),
}));
