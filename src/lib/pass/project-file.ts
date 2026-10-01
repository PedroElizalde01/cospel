import { z } from "zod";
import { PassProjectSchema, SCHEMA_VERSION, type PassProject } from "./schema";

/**
 * `.walletpassproject` — portable JSON export. Local image blobs are
 * embedded as data URLs so a file fully reproduces the design elsewhere.
 */
export const PROJECT_FILE_EXT = ".walletpassproject";
export const PROJECT_FILE_FORMAT = "walletpassproject";

export const EmbeddedAssetSchema = z.object({
  mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
});
export type EmbeddedAsset = z.infer<typeof EmbeddedAssetSchema>;

const FileSchema = z.object({
  format: z.literal(PROJECT_FILE_FORMAT),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  project: z.unknown(),
  assets: z.record(z.string(), EmbeddedAssetSchema).default({}),
});

export interface ProjectFile {
  format: typeof PROJECT_FILE_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  project: PassProject;
  assets: Record<string, EmbeddedAsset>;
}

export function buildProjectFile(project: PassProject, assets: Record<string, EmbeddedAsset>): ProjectFile {
  return { format: PROJECT_FILE_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), project, assets };
}

/** Upgrades older project JSON to the current schema. Add a case per version bump. */
export function migrateProject(raw: unknown, fromVersion: number): unknown {
  if (fromVersion > SCHEMA_VERSION) throw new Error(`This file was made with a newer version (schema ${fromVersion}).`);
  // v1 is the first version: nothing to migrate yet.
  return raw;
}

export function parseProjectFile(text: string): { project: PassProject; assets: Record<string, EmbeddedAsset> } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON.");
  }
  const file = FileSchema.safeParse(json);
  if (!file.success) throw new Error("This isn't a .walletpassproject file.");
  const migrated = migrateProject(file.data.project, file.data.schemaVersion);
  const project = PassProjectSchema.safeParse(migrated);
  if (!project.success) throw new Error(`The pass design is invalid: ${project.error.issues[0]?.message ?? "unknown error"}`);
  // Every local image reference must be satisfied by an embedded asset.
  for (const ref of Object.values(project.data.images)) {
    if (ref?.kind === "local" && !file.data.assets[ref.id]) throw new Error("The file references an image that isn't included.");
  }
  return { project: project.data, assets: file.data.assets };
}
