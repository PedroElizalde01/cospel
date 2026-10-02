import type { PassProject } from "./schema";

/**
 * Template variables: `{{customer.points}}` in any pass text.
 * Each issued pass fills them from customer data; the editor uses `sampleData`.
 */
export const VARIABLE_RE = /\{\{\s*([A-Za-z_][\w-]*(?:\.[\w-]+)*)\s*\}\}/g;

export const VARIABLE_PRESETS = [
  { key: "customer.name", sample: "Maya Chen" },
  { key: "customer.member_id", sample: "48213" },
  { key: "customer.points", sample: "120" },
  { key: "customer.tier", sample: "Gold" },
  { key: "customer.email", sample: "maya@example.com" },
  { key: "event.seat", sample: "14A" },
  { key: "event.section", sample: "B" },
  { key: "ticket.type", sample: "VIP" },
] as const;

export type VariableData = Record<string, string>;

/** Replaces known variables; unknown ones stay visible as `{{name}}`. */
export function interpolate(text: string, data: VariableData): string {
  if (!text.includes("{{")) return text;
  return text.replace(VARIABLE_RE, (raw, name: string) => (name in data ? data[name] : raw));
}

function textsOf(p: PassProject): string[] {
  const b = p.branding;
  return [
    b.organizationName,
    b.description,
    b.logoText,
    p.barcode.message,
    p.barcode.altText,
    ...Object.values(p.fields).flatMap((list) => list.flatMap((f) => [f.label, f.value])),
    ...p.relevance.locations.map((l) => l.relevantText),
  ];
}

/** Variables used anywhere in the pass, with how many times each appears. In first-seen order. */
export function extractVariables(p: PassProject): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of textsOf(p)) for (const m of t.matchAll(VARIABLE_RE)) out.set(m[1], (out.get(m[1]) ?? 0) + 1);
  return out;
}

/** The pass with every text resolved against `data`. Ids and structure are unchanged. */
export function resolveProject(p: PassProject, data: VariableData = p.sampleData): PassProject {
  if (!extractVariables(p).size) return p;
  const r = (t: string) => interpolate(t, data);
  return {
    ...p,
    branding: { ...p.branding, organizationName: r(p.branding.organizationName), description: r(p.branding.description), logoText: r(p.branding.logoText) },
    barcode: { ...p.barcode, message: r(p.barcode.message), altText: r(p.barcode.altText) },
    fields: Object.fromEntries(
      Object.entries(p.fields).map(([g, list]) => [g, list.map((f) => ({ ...f, label: r(f.label), value: r(f.value) }))]),
    ) as PassProject["fields"],
    relevance: { ...p.relevance, locations: p.relevance.locations.map((l) => ({ ...l, relevantText: r(l.relevantText) })) },
  };
}
