import {
  SCHEMA_VERSION,
  uid,
  type PassField,
  type PassProject,
  type PassStyle,
  type PassProjectInput,
  PassProjectSchema,
} from "./schema";
import { PURPOSES, type PurposeId } from "./styles";

type FieldInit = Partial<Omit<PassField, "id">> & { key: string };

export function field(init: FieldInit): PassField {
  return {
    label: "",
    value: "",
    textAlignment: "natural",
    changeMessage: "",
    dataDetectors: ["phone", "link", "address", "calendarEvent"],
    ...init,
    id: uid(),
  };
}

type FieldsInit = Partial<Record<keyof PassProject["fields"], FieldInit[]>>;

export interface ProjectInit extends Omit<Partial<PassProjectInput>, "fields" | "branding" | "barcode"> {
  style: PassStyle;
  branding?: Partial<PassProject["branding"]>;
  barcode?: Partial<PassProject["barcode"]>;
  fields?: FieldsInit;
}

/** Builds a fully-defaulted, schema-valid project with fresh ids. */
export function createProject(init: ProjectInit): PassProject {
  const now = new Date().toISOString();
  const f = init.fields ?? {};
  const mk = (list?: FieldInit[]) => (list ?? []).map(field);
  return PassProjectSchema.parse({
    ...init,
    schemaVersion: SCHEMA_VERSION,
    id: uid(),
    branding: init.branding ?? {},
    barcode: init.barcode ?? {},
    fields: {
      header: mk(f.header),
      primary: mk(f.primary),
      secondary: mk(f.secondary),
      auxiliary: mk(f.auxiliary),
      footer: mk(f.footer),
      back: mk(f.back),
    },
    metadata: { ...init.metadata, createdAt: now, updatedAt: now },
  });
}

/** Deep copy with new project + field ids (duplicating, instantiating templates). */
export function cloneProject(p: PassProject, overrides: Partial<PassProject> = {}): PassProject {
  const now = new Date().toISOString();
  const copy = structuredClone(p);
  for (const list of Object.values(copy.fields)) for (const f of list) f.id = uid();
  for (const l of copy.relevance.locations) l.id = uid();
  return { ...copy, ...overrides, id: uid(), metadata: { ...copy.metadata, ...overrides.metadata, createdAt: now, updatedAt: now } };
}

/** Sensible starting content for each purpose, so the preview never starts empty. */
export function starterProject(purpose: PurposeId): PassProject {
  const style = PURPOSES.find((p) => p.id === purpose)!.style;
  const base = { name: PURPOSES.find((p) => p.id === purpose)!.name };
  const terms = { key: "terms", label: "Terms & Conditions", value: "Add your terms here." };
  switch (purpose) {
    case "loyalty":
      return createProject({
        ...base, style,
        branding: { organizationName: "Your Business", description: "Loyalty card", logoText: "Your Business", backgroundColor: "#f4ede4", foregroundColor: "#2b1d14", labelColor: "#8a6a52" },
        fields: {
          header: [{ key: "points", label: "Points", value: "120" }],
          primary: [{ key: "reward", label: "Next reward", value: "Free coffee" }],
          secondary: [{ key: "member", label: "Member", value: "Alex Rivera" }],
          auxiliary: [{ key: "tier", label: "Tier", value: "Gold" }],
          back: [terms],
        },
        barcode: { message: "MBR-000123", altText: "MBR-000123" },
      });
    case "membership":
      return createProject({
        ...base, style,
        branding: { organizationName: "Your Club", description: "Membership card", logoText: "Your Club", backgroundColor: "#111113", foregroundColor: "#ffffff", labelColor: "#9b9ba1" },
        fields: {
          header: [{ key: "since", label: "Member since", value: "2024" }],
          primary: [{ key: "name", label: "Member", value: "Alex Rivera" }],
          secondary: [{ key: "plan", label: "Plan", value: "Annual" }, { key: "id", label: "Member ID", value: "000123" }],
          back: [terms],
        },
        barcode: { message: "000123", altText: "000123" },
      });
    case "event":
      return createProject({
        ...base, style,
        branding: { organizationName: "Your Event", description: "Event ticket", logoText: "Your Event", backgroundColor: "#0b0b0f", foregroundColor: "#ffffff", labelColor: "#ff6b4a" },
        fields: {
          header: [{ key: "date", label: "Date", value: "Jun 14" }],
          primary: [{ key: "event", label: "Event", value: "Live in Concert" }],
          secondary: [{ key: "venue", label: "Venue", value: "Main Hall" }, { key: "doors", label: "Doors", value: "7:00 PM", textAlignment: "right" }],
          auxiliary: [{ key: "section", label: "Section", value: "A" }, { key: "row", label: "Row", value: "12" }, { key: "seat", label: "Seat", value: "8" }],
          back: [terms],
        },
        barcode: { message: "TKT-8F2K-19QX", altText: "TKT-8F2K-19QX" },
      });
    case "giftCard":
      return createProject({
        ...base, style,
        branding: { organizationName: "Your Store", description: "Gift card", logoText: "Your Store", backgroundColor: "#1d3b2a", foregroundColor: "#ffffff", labelColor: "#b8d8c2" },
        fields: {
          primary: [{ key: "balance", label: "Balance", value: "$50.00" }],
          secondary: [{ key: "card", label: "Card number", value: "6012 4410" }],
          auxiliary: [{ key: "expires", label: "Expires", value: "Dec 2027", textAlignment: "right" }],
          back: [terms],
        },
        barcode: { format: "pdf417", message: "60124410", altText: "6012 4410" },
      });
    case "coupon":
      return createProject({
        ...base, style,
        branding: { organizationName: "Your Store", description: "Coupon", logoText: "Your Store", backgroundColor: "#e5372b", foregroundColor: "#ffffff", labelColor: "#ffd2cc" },
        fields: {
          primary: [{ key: "offer", label: "On your next order", value: "20% off" }],
          secondary: [{ key: "code", label: "Code", value: "SAVE20" }],
          auxiliary: [{ key: "expires", label: "Expires", value: "Dec 31", textAlignment: "right" }],
          back: [terms],
        },
        barcode: { message: "SAVE20", altText: "SAVE20" },
      });
    case "storeCard":
      return createProject({
        ...base, style,
        branding: { organizationName: "Your Store", description: "Store card", logoText: "Your Store", backgroundColor: "#ffffff", foregroundColor: "#111111", labelColor: "#6b6b6b" },
        fields: {
          primary: [{ key: "perk", label: "Member perk", value: "10% off" }],
          secondary: [{ key: "member", label: "Member", value: "Alex Rivera" }],
          auxiliary: [{ key: "since", label: "Since", value: "2024", textAlignment: "right" }],
          back: [terms],
        },
        barcode: { message: "STORE-000123", altText: "000123" },
      });
    case "generic":
      return createProject({
        ...base, style,
        branding: { organizationName: "Your Organization", description: "Card", logoText: "Your Organization", backgroundColor: "#1c1c1e", foregroundColor: "#ffffff", labelColor: "#a1a1aa" },
        fields: {
          primary: [{ key: "name", label: "Name", value: "Alex Rivera" }],
          secondary: [{ key: "role", label: "Role", value: "Guest" }],
          back: [terms],
        },
        barcode: { message: "ID-000123" },
      });
    case "boarding":
      return createProject({
        ...base, style, transitType: "air",
        branding: { organizationName: "Your Airline", description: "Boarding pass", logoText: "Your Airline", backgroundColor: "#0f2a4a", foregroundColor: "#ffffff", labelColor: "#8fb3db" },
        fields: {
          header: [{ key: "gate", label: "Gate", value: "B12", changeMessage: "Gate changed to %@" }],
          primary: [{ key: "origin", label: "San Francisco", value: "SFO" }, { key: "destination", label: "New York", value: "JFK" }],
          secondary: [{ key: "passenger", label: "Passenger", value: "Alex Rivera" }, { key: "seat", label: "Seat", value: "14A", textAlignment: "right" }],
          auxiliary: [{ key: "flight", label: "Flight", value: "YA 482" }, { key: "boards", label: "Boards", value: "8:15 AM" }, { key: "departs", label: "Departs", value: "8:45 AM", textAlignment: "right" }],
          back: [terms],
        },
        barcode: { format: "pdf417", message: "M1RIVERA/ALEX EYA482 SFOJFK", altText: "" },
      });
    case "poster":
      return createProject({
        ...base, style, compatibility: { target: "latest", minIOS: 27 },
        branding: { organizationName: "Your Club", description: "Membership card", backgroundColor: "#1a1f2e", foregroundColor: "#ffffff", labelColor: "#c9cfdd" },
        fields: {
          header: [{ key: "id", label: "Member No.", value: "102035" }],
          primary: [{ key: "title", label: "", value: "Annual Member" }, { key: "name", label: "Name", value: "Alex Rivera" }],
          footer: [{ key: "plan", value: "Family Pass" }],
          back: [terms],
        },
        barcode: { message: "102035" },
      });
    case "blank":
      return createProject({
        ...base, name: "Blank pass", style,
        branding: { organizationName: "", description: "", backgroundColor: "#ffffff", foregroundColor: "#111111", labelColor: "#6b6b6b" },
        barcode: { enabled: false },
      });
  }
}
