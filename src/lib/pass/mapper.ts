import { BARCODE_SPECS } from "./barcode";
import { toPassColor } from "./color";
import { minIOSFor, type ImageSlot, type PassField, type PassProject } from "./schema";
import { STYLE_SPECS, effectiveImages, imageSpec, posterFallback, visibleFields } from "./styles";

/** Values only the server knows when it signs a pass. Preview uses placeholders. */
export interface PassIdentity {
  passTypeIdentifier: string;
  teamIdentifier: string;
  serialNumber: string;
  webServiceURL?: string;
  authenticationToken?: string;
}

export const PREVIEW_IDENTITY: PassIdentity = {
  passTypeIdentifier: "pass.com.example.preview",
  teamIdentifier: "XXXXXXXXXX",
  serialNumber: "preview",
};

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export type PassJson = { [k: string]: Json };

const ALIGN = { left: "PKTextAlignmentLeft", center: "PKTextAlignmentCenter", right: "PKTextAlignmentRight" } as const;
const DETECT = {
  phone: "PKDataDetectorTypePhoneNumber",
  link: "PKDataDetectorTypeLink",
  address: "PKDataDetectorTypeAddress",
  calendarEvent: "PKDataDetectorTypeCalendarEvent",
} as const;
const TRANSIT = {
  air: "PKTransitTypeAir",
  train: "PKTransitTypeTrain",
  bus: "PKTransitTypeBus",
  boat: "PKTransitTypeBoat",
  generic: "PKTransitTypeGeneric",
} as const;

function mapField(f: PassField, back = false): PassJson {
  const out: PassJson = { key: f.key, value: f.value };
  if (f.label) out.label = f.label;
  if (f.textAlignment !== "natural") out.textAlignment = ALIGN[f.textAlignment];
  if (f.changeMessage) out.changeMessage = f.changeMessage;
  if (back) out.dataDetectorTypes = f.dataDetectors.map((d) => DETECT[d]);
  return out;
}

function fieldDict(groups: Partial<Record<string, PassField[]>>, back: PassField[]) {
  const dict: PassJson = {};
  for (const [name, list] of Object.entries(groups)) if (list?.length) dict[`${name}Fields`] = list.map((f) => mapField(f));
  if (back.length) dict.backFields = back.map((f) => mapField(f, true));
  return dict;
}

/**
 * Canonical project -> Apple pass.json. Field limits are enforced here
 * (same `visibleFields` the preview uses), so the generated pass never
 * contains layout Wallet would reject or silently drop.
 */
export function toPassJson(p: PassProject, id: PassIdentity = PREVIEW_IDENTITY): PassJson {
  const b = p.branding;
  const v = visibleFields(p);
  const json: PassJson = {
    formatVersion: 1,
    passTypeIdentifier: id.passTypeIdentifier,
    teamIdentifier: id.teamIdentifier,
    serialNumber: id.serialNumber,
    organizationName: b.organizationName,
    description: b.description,
    backgroundColor: toPassColor(b.backgroundColor),
    foregroundColor: toPassColor(b.foregroundColor),
    labelColor: toPassColor(b.labelColor),
  };
  if (b.logoText && p.style !== "posterGeneric") json.logoText = b.logoText;
  if (id.webServiceURL && id.authenticationToken) {
    json.webServiceURL = id.webServiceURL;
    json.authenticationToken = id.authenticationToken;
  }

  if (p.style === "posterGeneric") {
    json.posterGeneric = fieldDict({ header: v.header, primary: v.primary, footer: v.footer }, v.back);
    // Older Wallet versions ignore posterGeneric and render this instead. Same keys keep updates in sync.
    const fb = visibleFields(posterFallback(p));
    json.generic = fieldDict({ header: fb.header, primary: fb.primary, secondary: fb.secondary, auxiliary: fb.auxiliary }, fb.back);
  } else {
    const dict = fieldDict(
      { header: v.header, primary: v.primary, secondary: v.secondary, auxiliary: v.auxiliary },
      v.back,
    );
    if (p.style === "boardingPass") dict.transitType = TRANSIT[p.transitType];
    json[STYLE_SPECS[p.style].appleKey] = dict;
  }

  if (p.barcode.enabled && p.barcode.message) {
    const entry = (format: keyof typeof BARCODE_SPECS): PassJson => {
      const e: PassJson = { format: BARCODE_SPECS[format].apple, message: p.barcode.message, messageEncoding: p.barcode.encoding };
      if (p.barcode.altText) e.altText = p.barcode.altText;
      return e;
    };
    const list = [entry(p.barcode.format)];
    const needsFallback = BARCODE_SPECS[p.barcode.format].minIOS > minIOSFor(p.compatibility);
    if (p.barcode.fallbackFormat && needsFallback) list.push(entry(p.barcode.fallbackFormat));
    json.barcodes = list;
  }

  const r = p.relevance;
  if (r.relevantDate) {
    json.relevantDate = r.relevantDate;
    json.relevantDates = [{ date: r.relevantDate }];
  }
  if (r.expirationDate) json.expirationDate = r.expirationDate;
  if (r.locations.length) {
    json.locations = r.locations.slice(0, 10).map((l) => {
      const loc: PassJson = { latitude: l.latitude, longitude: l.longitude };
      if (l.relevantText) loc.relevantText = l.relevantText;
      return loc;
    });
  }
  if (r.maxDistance) json.maxDistance = r.maxDistance;
  return json;
}

export interface PassImageFile {
  slot: ImageSlot;
  /** Base name inside the .pkpass, e.g. "strip" -> strip.png, strip@2x.png, strip@3x.png */
  name: string;
  width: number;
  height: number;
}

/** Image files the signed bundle will contain (rendered server-side at @1x/@2x/@3x). */
export function passImageFiles(p: PassProject): PassImageFile[] {
  const imgs = effectiveImages(p);
  const files: PassImageFile[] = [];
  for (const slot of Object.keys(imgs) as ImageSlot[]) {
    const s = imageSpec(slot, p.style);
    files.push({ slot, name: slot, width: s.width, height: s.height });
    // Poster passes need primaryLogo; the generic fallback still uses logo.
    if (p.style === "posterGeneric" && slot === "logo") files.push({ slot, name: "primaryLogo", width: 126, height: 30 });
  }
  return files;
}
