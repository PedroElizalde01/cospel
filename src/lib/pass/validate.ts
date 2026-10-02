import { BARCODE_SPECS } from "./barcode";
import { contrastRatio, isHex } from "./color";
import { FIELD_GROUPS, minIOSFor, type FieldGroup, type ImageSlot, type PassProject } from "./schema";
import { STYLE_SPECS, SQUARE_BARCODES, combinedRowMax, imageSpec } from "./styles";
import { extractVariables, resolveProject, type VariableData } from "./variables";

export type Severity = "error" | "warning" | "suggestion";
export type PanelId = "content" | "design" | "barcode" | "details" | "relevance" | "data" | "settings";

export interface Issue {
  id: string;
  severity: Severity;
  message: string;
  /** Where clicking the issue should take the user. `control` matches a DOM id in the editor. */
  target: { panel: PanelId; fieldId?: string; control?: string };
}

export interface ValidationContext {
  /** "generate" turns preview-time warnings that block signing into errors. */
  mode?: "preview" | "generate";
  /** Values for `{{variables}}`. Defaults to the project's sample data. */
  data?: VariableData;
  signing?: { configured: boolean; expiresAt?: string | null };
  now?: Date;
}

/** Rough per-row character budgets before Wallet truncates (320 pt wide face). */
const TRUNCATE_AT: Partial<Record<FieldGroup, number>> = { header: 12, primary: 20, secondary: 22, auxiliary: 22, footer: 32 };

const GROUP_PANEL = (g: FieldGroup): PanelId => (g === "back" ? "details" : "content");

export function validateProject(raw: PassProject, ctx: ValidationContext = {}): Issue[] {
  const issues: Issue[] = [];
  const add = (severity: Severity, id: string, message: string, target: Issue["target"]) =>
    issues.push({ id, severity, message, target });
  const generating = ctx.mode === "generate";
  const data = ctx.data ?? raw.sampleData;

  // Variables: checked on the raw design; every other rule sees resolved values.
  for (const name of extractVariables(raw).keys()) {
    if (!(name in data) || data[name] === "") {
      add(generating ? "error" : "suggestion", `var-${name}`, generating ? `Variable {{${name}}} has no value.` : `Add a sample value for {{${name}}} to preview it.`, { panel: "data", control: `var-${name}` });
    }
  }
  const p = resolveProject(raw, data);
  const spec = STYLE_SPECS[p.style];
  const b = p.branding;
  const minIOS = minIOSFor(p.compatibility);

  // Identity & branding
  if (!b.organizationName.trim()) add("error", "org", "Add an organization name. Wallet shows it in notifications.", { panel: "content", control: "organizationName" });
  if (!b.description.trim()) add("error", "description", "Add a short description. VoiceOver reads it aloud.", { panel: "content", control: "description" });
  for (const k of ["backgroundColor", "foregroundColor", "labelColor"] as const) {
    if (!isHex(b[k])) add("error", `color-${k}`, `${k} must be a hex color like #1c1c1e.`, { panel: "design", control: k });
  }
  if (isHex(b.backgroundColor) && isHex(b.foregroundColor) && contrastRatio(b.backgroundColor, b.foregroundColor) < 3) {
    add("warning", "contrast-fg", "Text color has low contrast against the background.", { panel: "design", control: "foregroundColor" });
  }
  if (isHex(b.backgroundColor) && isHex(b.labelColor) && contrastRatio(b.backgroundColor, b.labelColor) < 2) {
    add("suggestion", "contrast-label", "Label color is hard to read against the background.", { panel: "design", control: "labelColor" });
  }
  if (!p.images.logo && !b.logoText.trim() && p.style !== "posterGeneric") {
    add("suggestion", "logo", "Add a logo or logo text so the pass is recognizable in the Wallet stack.", { panel: "design", control: "image-logo" });
  }

  // Fields
  const allFields = FIELD_GROUPS.flatMap((g) => p.fields[g].map((f) => ({ f, g })));
  const seen = new Map<string, number>();
  for (const { f } of allFields) seen.set(f.key, (seen.get(f.key) ?? 0) + 1);
  for (const { f, g } of allFields) {
    const target = { panel: GROUP_PANEL(g), fieldId: f.id };
    if (!f.key.trim()) add("error", `key-empty-${f.id}`, `A ${g} field has no key.`, target);
    else if ((seen.get(f.key) ?? 0) > 1) add("error", `key-dup-${f.id}`, `Field key "${f.key}" is used more than once. Keys must be unique.`, target);
    else if (!/^[A-Za-z0-9_.-]+$/.test(f.key)) add("suggestion", `key-chars-${f.id}`, `Key "${f.key}" is easier to work with using only letters, numbers, _ . -`, target);
    if (f.changeMessage && !f.changeMessage.includes("%@")) {
      add("warning", `change-${f.id}`, `Change message for "${f.label || f.key}" should include %@ where the new value goes.`, target);
    }
    const limit = TRUNCATE_AT[g];
    if (limit && spec.groups[g] && f.value.length > limit) {
      add("warning", `trunc-${f.id}`, `"${f.value.slice(0, 24)}…" will likely be truncated in the ${g} row.`, target);
    }
  }

  for (const g of FIELD_GROUPS) {
    const list = p.fields[g];
    const gs = spec.groups[g];
    if (!list.length) continue;
    if (!gs) {
      add("warning", `group-${g}`, `${spec.name} passes don't show ${g} fields. ${list.length} field(s) won't appear.`, { panel: "content", fieldId: list[0].id });
    } else if (list.length > gs.max) {
      add("warning", `max-${g}`, `${spec.name} passes show at most ${gs.max} ${g} field${gs.max === 1 ? "" : "s"}. ${list.length - gs.max} won't appear.`, { panel: GROUP_PANEL(g), fieldId: list[gs.max].id });
    }
  }
  const combined = combinedRowMax(p);
  if (combined !== undefined) {
    const n = p.fields.secondary.length + p.fields.auxiliary.length;
    if (n > combined) {
      const why = p.style === "generic" ? "Generic passes with a square barcode" : `${spec.name}s`;
      add("warning", "combined-row", `${why} support limited front-facing field space: ${combined} secondary + auxiliary fields total. Some values will be hidden in Wallet.`, { panel: "content" });
    }
  }
  if (p.style === "boardingPass" && p.fields.primary.length < 2) {
    add("suggestion", "boarding-primary", "Boarding passes read best with two primary fields: origin and destination.", { panel: "content" });
  }
  if (p.style !== "posterGeneric" && !p.fields.primary.length) {
    add("suggestion", "primary-empty", "Add a primary field. It's the most prominent text on the pass.", { panel: "content" });
  }

  // Images
  const imgs = p.images;
  for (const slot of Object.keys(imgs) as ImageSlot[]) {
    if (!spec.images.includes(slot)) {
      add("warning", `img-unsupported-${slot}`, `${spec.name} passes don't use a ${slot} image. It will be left out.`, { panel: "design", control: `image-${slot}` });
      continue;
    }
    const ref = imgs[slot]!;
    const s = imageSpec(slot, p.style);
    if (ref.kind === "local" && s.fit === "exact" && (ref.width < s.width * 2 || ref.height < s.height * 2)) {
      add("suggestion", `img-small-${slot}`, `${s.label} is ${ref.width}×${ref.height}px. Use at least ${s.width * 2}×${s.height * 2}px to stay sharp.`, { panel: "design", control: `image-${slot}` });
    }
  }
  if (p.style === "eventTicket" && imgs.strip && (imgs.background || imgs.thumbnail)) {
    add("warning", "img-combo", "Event tickets with a strip image ignore background and thumbnail images.", { panel: "design", control: "image-strip" });
  }
  if (!imgs.icon) {
    add(generating ? "error" : "warning", "icon", "Apple requires an icon (29×29 pt). Add one before generating a real pass.", { panel: "design", control: "image-icon" });
  }
  if (p.style === "posterGeneric" && !imgs.artwork) {
    add("warning", "artwork", "Poster passes are built around artwork. Add an artwork image.", { panel: "design", control: "image-artwork" });
  }

  // Compatibility
  if (spec.minIOS && spec.minIOS > minIOS) {
    add("suggestion", "style-compat", `${spec.name} needs iOS ${spec.minIOS}. Older devices will show the Generic fallback.`, { panel: "settings", control: "compatibility" });
  }

  // Barcode
  const bc = p.barcode;
  if (bc.enabled) {
    const fs = BARCODE_SPECS[bc.format];
    if (!bc.message) add("error", "barcode-empty", "Barcode is on but has no message.", { panel: "barcode", control: "barcode-message" });
    else {
      const err = fs.check?.(bc.message);
      if (err) add("error", "barcode-format", err, { panel: "barcode", control: "barcode-message" });
    }
    if (fs.minIOS > minIOS && !bc.fallbackFormat) {
      add("warning", "barcode-compat", `${fs.name} needs iOS ${fs.minIOS}. Add a fallback format or older devices show no code.`, { panel: "barcode", control: "barcode-fallback" });
    }
    if (!fs.watch) add("suggestion", "barcode-watch", `${fs.name} isn't shown on Apple Watch. QR, PDF417 or Aztec work everywhere.`, { panel: "barcode", control: "barcode-format" });
    if (p.style === "posterGeneric" && !SQUARE_BARCODES.includes(bc.format)) {
      add("suggestion", "barcode-poster", "Poster passes show a square code. QR is the natural choice.", { panel: "barcode", control: "barcode-format" });
    }
  }

  // Relevance
  const r = p.relevance;
  const now = ctx.now ?? new Date();
  for (const k of ["relevantDate", "expirationDate"] as const) {
    if (r[k] && Number.isNaN(Date.parse(r[k]))) add("error", `date-${k}`, `${k} isn't a valid date.`, { panel: "relevance", control: k });
  }
  if (r.expirationDate && Date.parse(r.expirationDate) < now.getTime()) {
    add("warning", "expired", "Expiration date is in the past. Wallet will show the pass as expired.", { panel: "relevance", control: "expirationDate" });
  }
  if (r.relevantDate && r.expirationDate && Date.parse(r.expirationDate) < Date.parse(r.relevantDate)) {
    add("warning", "expire-before-relevant", "Pass expires before its relevant date.", { panel: "relevance", control: "expirationDate" });
  }
  r.locations.forEach((l, i) => {
    if (!(l.latitude >= -90 && l.latitude <= 90) || !(l.longitude >= -180 && l.longitude <= 180)) {
      add("error", `loc-${l.id}`, `Location ${i + 1} has invalid coordinates.`, { panel: "relevance", control: `loc-${l.id}` });
    }
  });
  if (r.locations.length > 10) add("warning", "loc-max", "Wallet uses at most 10 locations. Extra ones are dropped.", { panel: "relevance" });

  // Signing (server provides context)
  if (ctx.signing) {
    if (!ctx.signing.configured) {
      add(generating ? "error" : "suggestion", "signing", "Signing isn't configured. You can preview and export, but not create a real pass yet.", { panel: "settings" });
    } else if (ctx.signing.expiresAt) {
      const exp = Date.parse(ctx.signing.expiresAt);
      if (exp < now.getTime()) add("error", "cert-expired", "The signing certificate has expired.", { panel: "settings" });
      else if (exp - now.getTime() < 30 * 864e5) add("warning", "cert-expiring", "The signing certificate expires within 30 days.", { panel: "settings" });
    }
  }

  const rank: Record<Severity, number> = { error: 0, warning: 1, suggestion: 2 };
  return issues.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
