import { z } from "zod";

/**
 * Canonical, UI-independent pass model. Everything (preview, validator,
 * pass.json mapper, export files, future DB rows) speaks this shape.
 * Bump SCHEMA_VERSION and extend `migrateProject` when it changes.
 */
export const SCHEMA_VERSION = 1;

export const PASS_STYLES = [
  "generic",
  "storeCard",
  "coupon",
  "eventTicket",
  "boardingPass",
  "posterGeneric",
] as const;
export const PassStyleSchema = z.enum(PASS_STYLES);
export type PassStyle = z.infer<typeof PassStyleSchema>;

export const FIELD_GROUPS = ["header", "primary", "secondary", "auxiliary", "footer", "back"] as const;
export const FieldGroupSchema = z.enum(FIELD_GROUPS);
export type FieldGroup = z.infer<typeof FieldGroupSchema>;

export const TextAlignmentSchema = z.enum(["natural", "left", "center", "right"]);
export type TextAlignment = z.infer<typeof TextAlignmentSchema>;

export const DataDetectorSchema = z.enum(["phone", "link", "address", "calendarEvent"]);
export type DataDetector = z.infer<typeof DataDetectorSchema>;

export const PassFieldSchema = z.object({
  /** Internal stable id (UI selection, drag-and-drop). Never emitted to pass.json. */
  id: z.string().min(1),
  /** pass.json `key`. Must be unique across the whole pass. */
  key: z.string(),
  label: z.string().default(""),
  value: z.string().default(""),
  textAlignment: TextAlignmentSchema.default("natural"),
  /** Shown in a notification when an updated pass changes this value. Must contain %@. */
  changeMessage: z.string().default(""),
  /** Only meaningful for back (details) fields. */
  dataDetectors: z.array(DataDetectorSchema).default(["phone", "link", "address", "calendarEvent"]),
});
export type PassField = z.infer<typeof PassFieldSchema>;

export const IMAGE_SLOTS = ["logo", "icon", "strip", "thumbnail", "background", "footer", "artwork"] as const;
export const ImageSlotSchema = z.enum(IMAGE_SLOTS);
export type ImageSlot = z.infer<typeof ImageSlotSchema>;

export const AssetRefSchema = z.discriminatedUnion("kind", [
  /** Blob stored in the browser (IndexedDB). `originalId` keeps the uncropped source for re-editing. */
  z.object({
    kind: z.literal("local"),
    id: z.string().min(1),
    originalId: z.string().optional(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  /** Static asset shipped with the app (system templates) or hosted later. */
  z.object({
    kind: z.literal("url"),
    url: z.string().min(1),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
]);
export type AssetRef = z.infer<typeof AssetRefSchema>;

export const BARCODE_FORMATS = ["qr", "pdf417", "aztec", "code128", "ean13", "code39", "codabar", "itf"] as const;
export const BarcodeFormatSchema = z.enum(BARCODE_FORMATS);
export type BarcodeFormat = z.infer<typeof BarcodeFormatSchema>;

export const BarcodeSchema = z.object({
  enabled: z.boolean().default(true),
  format: BarcodeFormatSchema.default("qr"),
  message: z.string().default(""),
  encoding: z.enum(["iso-8859-1", "utf-8"]).default("iso-8859-1"),
  altText: z.string().default(""),
  /** Emitted after `format` so older Wallet versions can still show a code. */
  fallbackFormat: z.enum(["qr", "pdf417", "aztec", "code128"]).nullable().default(null),
});
export type Barcode = z.infer<typeof BarcodeSchema>;

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const BrandingSchema = z.object({
  organizationName: z.string().default(""),
  /** Required by Apple; read by VoiceOver. */
  description: z.string().default(""),
  logoText: z.string().default(""),
  backgroundColor: z.string().default("#1c1c1e"),
  foregroundColor: z.string().default("#ffffff"),
  labelColor: z.string().default("#a1a1aa"),
});
export type Branding = z.infer<typeof BrandingSchema>;

export const LocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().default(""),
  latitude: z.number(),
  longitude: z.number(),
  /** Lock-screen text when the user is nearby. */
  relevantText: z.string().default(""),
});
export type PassLocation = z.infer<typeof LocationSchema>;

export const RelevanceSchema = z.object({
  /** ISO 8601 with offset, or "" when unset. */
  relevantDate: z.string().default(""),
  expirationDate: z.string().default(""),
  locations: z.array(LocationSchema).default([]),
  /** Meters. Wallet may cap this per style. */
  maxDistance: z.number().positive().nullable().default(null),
});
export type Relevance = z.infer<typeof RelevanceSchema>;

export const CompatibilitySchema = z.object({
  target: z.enum(["broad", "latest", "custom"]).default("broad"),
  /** Only used when target === "custom". */
  minIOS: z.number().int().min(15).max(27).default(17),
});
export type Compatibility = z.infer<typeof CompatibilitySchema>;

export const TRANSIT_TYPES = ["air", "train", "bus", "boat", "generic"] as const;

const fieldList = z.array(PassFieldSchema).default([]);

export const PassProjectSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string().default("Untitled pass"),
  style: PassStyleSchema,
  transitType: z.enum(TRANSIT_TYPES).default("air"),
  compatibility: CompatibilitySchema.default({ target: "broad", minIOS: 17 }),
  branding: BrandingSchema,
  fields: z.object({
    header: fieldList,
    primary: fieldList,
    secondary: fieldList,
    auxiliary: fieldList,
    footer: fieldList,
    back: fieldList,
  }),
  barcode: BarcodeSchema,
  images: z.partialRecord(ImageSlotSchema, AssetRefSchema).default({}),
  /** Example values for `{{variables}}`, used by the preview. Real passes use customer data. */
  sampleData: z.record(z.string(), z.string()).default({}),
  relevance: RelevanceSchema.default({ relevantDate: "", expirationDate: "", locations: [], maxDistance: null }),
  metadata: z
    .object({
      templateSlug: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .default(() => ({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
});
export type PassProject = z.infer<typeof PassProjectSchema>;
export type PassProjectInput = z.input<typeof PassProjectSchema>;

export const uid = () => crypto.randomUUID();

export function minIOSFor(c: Compatibility): number {
  if (c.target === "latest") return 27;
  if (c.target === "custom") return c.minIOS;
  return 15;
}
