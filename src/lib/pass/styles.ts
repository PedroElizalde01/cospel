import type { BarcodeFormat, FieldGroup, ImageSlot, PassProject, PassStyle } from "./schema";

/**
 * Apple Wallet layout constraints per pass style.
 * Sources: Apple "Pass Design and Creation" guide, Wallet HIG, WWDC26 "What's new in Wallet".
 */
export interface GroupSpec {
  max: number;
  label: string;
  hint: string;
}

export interface StyleSpec {
  id: PassStyle;
  name: string;
  appleKey: string;
  summary: string;
  groups: Partial<Record<FieldGroup, GroupSpec>>;
  /** Secondary + auxiliary fields share one row with this many slots (store cards, coupons, generic + square barcode). */
  combinedRowMax?: number | ((p: PassProject) => number | undefined);
  images: ImageSlot[];
  minIOS?: number;
}

const BACK: GroupSpec = { max: 50, label: "Details", hint: "Shown on the pass details screen." };
const HEADER: GroupSpec = { max: 3, label: "Header", hint: "Top right. Stays visible when the pass is stacked in Wallet." };

export const SQUARE_BARCODES: BarcodeFormat[] = ["qr", "aztec"];

export const STYLE_SPECS: Record<PassStyle, StyleSpec> = {
  generic: {
    id: "generic",
    name: "Generic",
    appleKey: "generic",
    summary: "Memberships, IDs, pickup cards and anything that doesn't fit another style.",
    groups: {
      header: HEADER,
      primary: { max: 1, label: "Primary", hint: "The most important value, shown large." },
      secondary: { max: 4, label: "Secondary", hint: "Row below the primary field." },
      auxiliary: { max: 4, label: "Auxiliary", hint: "Row below secondary fields." },
      back: BACK,
    },
    combinedRowMax: (p) => (p.barcode.enabled && SQUARE_BARCODES.includes(p.barcode.format) ? 4 : undefined),
    images: ["logo", "icon", "thumbnail"],
  },
  storeCard: {
    id: "storeCard",
    name: "Store Card",
    appleKey: "storeCard",
    summary: "Loyalty, points, gift balance and store membership cards.",
    groups: {
      header: HEADER,
      primary: { max: 1, label: "Primary", hint: "Shown large over the strip image." },
      secondary: { max: 4, label: "Secondary", hint: "Shares one row with auxiliary fields." },
      auxiliary: { max: 4, label: "Auxiliary", hint: "Shares one row with secondary fields." },
      back: BACK,
    },
    combinedRowMax: 4,
    images: ["logo", "icon", "strip"],
  },
  coupon: {
    id: "coupon",
    name: "Coupon",
    appleKey: "coupon",
    summary: "Offers, discounts and one-time promotions.",
    groups: {
      header: HEADER,
      primary: { max: 1, label: "Primary", hint: "The offer, shown large over the strip image." },
      secondary: { max: 4, label: "Secondary", hint: "Shares one row with auxiliary fields." },
      auxiliary: { max: 4, label: "Auxiliary", hint: "Shares one row with secondary fields." },
      back: BACK,
    },
    combinedRowMax: 4,
    images: ["logo", "icon", "strip"],
  },
  eventTicket: {
    id: "eventTicket",
    name: "Event Ticket",
    appleKey: "eventTicket",
    summary: "Concerts, conferences, festivals, cinema and sports.",
    groups: {
      header: HEADER,
      primary: { max: 1, label: "Primary", hint: "Usually the event name." },
      secondary: { max: 4, label: "Secondary", hint: "Date, venue, and similar." },
      auxiliary: { max: 4, label: "Auxiliary", hint: "Section, row, seat, entrance." },
      back: BACK,
    },
    images: ["logo", "icon", "strip", "background", "thumbnail"],
  },
  boardingPass: {
    id: "boardingPass",
    name: "Boarding Pass",
    appleKey: "boardingPass",
    summary: "Flights, trains, buses and ferries.",
    groups: {
      header: HEADER,
      primary: { max: 2, label: "Primary", hint: "Origin and destination, separated by the transit icon." },
      secondary: { max: 5, label: "Secondary", hint: "Passenger, seat, and similar." },
      auxiliary: { max: 5, label: "Auxiliary", hint: "Departure, boarding time, gate." },
      back: BACK,
    },
    images: ["logo", "icon", "footer"],
  },
  posterGeneric: {
    id: "posterGeneric",
    name: "Poster Generic",
    appleKey: "posterGeneric",
    summary: "Artwork-first membership and loyalty cards (iOS 27+, falls back to Generic).",
    groups: {
      header: { max: 1, label: "Header", hint: "One field, top right." },
      primary: { max: 4, label: "Primary", hint: "Over the artwork. A first field without a label becomes a bold title." },
      footer: { max: 1, label: "Footer", hint: "One field on the bottom material strip." },
      back: BACK,
    },
    images: ["logo", "icon", "artwork"],
    minIOS: 27,
  },
};

export interface ImageSpec {
  label: string;
  /** Points. Upload at @3x for best results. */
  width: number;
  height: number;
  /** Logos keep their own aspect within the box. */
  fit: "exact" | "contain";
  hint: string;
  required?: boolean;
}

export function imageSpec(slot: ImageSlot, style: PassStyle): ImageSpec {
  switch (slot) {
    case "logo":
      return style === "posterGeneric"
        ? { label: "Logo", width: 126, height: 30, fit: "contain", hint: "30 pt tall, up to 126 pt wide. Transparent PNG works best." }
        : { label: "Logo", width: 160, height: 50, fit: "contain", hint: "Top left. Up to 160×50 pt, usually narrower. Transparent PNG works best." };
    case "icon":
      return { label: "Icon", width: 29, height: 29, fit: "exact", hint: "Required by Apple. Shown on the lock screen and in notifications.", required: true };
    case "strip":
      return style === "eventTicket"
        ? { label: "Strip", width: 375, height: 98, fit: "exact", hint: "Behind the primary field. Disables background and thumbnail." }
        : { label: "Strip", width: 375, height: 144, fit: "exact", hint: "Behind the primary field." };
    case "thumbnail":
      return { label: "Thumbnail", width: 90, height: 90, fit: "exact", hint: "Next to the primary field. Aspect 2:3 to 3:2." };
    case "background":
      return { label: "Background", width: 180, height: 220, fit: "exact", hint: "Wallet crops and blurs it behind the whole front." };
    case "footer":
      return { label: "Footer", width: 286, height: 15, fit: "exact", hint: "Small image above the barcode." };
    case "artwork":
      return { label: "Artwork", width: 358, height: 448, fit: "exact", hint: "Full-bleed poster artwork. Keep text-free near the bottom edge." };
  }
}

export function groupsFor(style: PassStyle): FieldGroup[] {
  return (Object.keys(STYLE_SPECS[style].groups) as FieldGroup[]);
}

export function combinedRowMax(p: PassProject): number | undefined {
  const c = STYLE_SPECS[p.style].combinedRowMax;
  return typeof c === "function" ? c(p) : c;
}

/** Event tickets ignore background/thumbnail when a strip is set. */
export function effectiveImages(p: PassProject): Partial<PassProject["images"]> {
  const allowed = STYLE_SPECS[p.style].images;
  const out: Partial<PassProject["images"]> = {};
  for (const slot of allowed) if (p.images[slot]) out[slot] = p.images[slot];
  if (p.style === "eventTicket" && out.strip) {
    delete out.background;
    delete out.thumbnail;
  }
  return out;
}

/**
 * Front fields as Wallet will lay them out (limits applied).
 * Used by both the preview and the mapper so they never disagree.
 */
export function visibleFields(p: PassProject) {
  const spec = STYLE_SPECS[p.style];
  const take = (g: FieldGroup) => p.fields[g].slice(0, spec.groups[g]?.max ?? 0);
  const header = take("header");
  const primary = take("primary");
  let secondary = take("secondary");
  let auxiliary = take("auxiliary");
  const footer = take("footer");
  const combined = combinedRowMax(p);
  if (combined !== undefined) {
    secondary = secondary.slice(0, combined);
    auxiliary = auxiliary.slice(0, Math.max(0, combined - secondary.length));
  }
  return { header, primary, secondary, auxiliary, footer, back: p.fields.back.slice(0, BACK.max), combined: combined !== undefined };
}

export function hiddenFieldIds(p: PassProject): Set<string> {
  const v = visibleFields(p);
  const shown = new Set([...v.header, ...v.primary, ...v.secondary, ...v.auxiliary, ...v.footer, ...v.back].map((f) => f.id));
  const all = Object.values(p.fields).flat();
  return new Set(all.filter((f) => !shown.has(f.id)).map((f) => f.id));
}

/** User-facing purposes; Apple style names are shown secondarily. */
export const PURPOSES = [
  { id: "loyalty", name: "Loyalty card", style: "storeCard", blurb: "Stamps, points and rewards." },
  { id: "membership", name: "Membership", style: "generic", blurb: "Gyms, clubs, coworking." },
  { id: "event", name: "Event ticket", style: "eventTicket", blurb: "Concerts, conferences, festivals." },
  { id: "giftCard", name: "Gift card", style: "storeCard", blurb: "Prepaid balance and gift value." },
  { id: "coupon", name: "Coupon", style: "coupon", blurb: "Offers and discounts." },
  { id: "storeCard", name: "Store card", style: "storeCard", blurb: "Store membership and perks." },
  { id: "generic", name: "Generic card", style: "generic", blurb: "IDs, badges, pickup cards." },
  { id: "boarding", name: "Boarding pass", style: "boardingPass", blurb: "Flights, trains, buses, ferries." },
  { id: "poster", name: "Poster card", style: "posterGeneric", blurb: "Artwork-first membership. iOS 27+." },
  { id: "blank", name: "Blank pass", style: "generic", blurb: "Start from an empty canvas." },
] as const satisfies readonly { id: string; name: string; style: PassStyle; blurb: string }[];
export type PurposeId = (typeof PURPOSES)[number]["id"];

/** What Wallet on iOS 26 and earlier renders for a Poster Generic pass. Same keys, Generic layout. */
export function posterFallback(p: PassProject): PassProject {
  const v = visibleFields(p);
  return {
    ...p,
    style: "generic",
    fields: { header: v.header, primary: v.primary.slice(0, 1), secondary: v.primary.slice(1, 4), auxiliary: v.footer, footer: [], back: v.back },
  };
}
