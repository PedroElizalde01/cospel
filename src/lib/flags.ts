/**
 * Plan-based feature flags. Everything is enabled today: the playground must
 * stay genuinely useful for free. Flip entries here when pricing launches.
 */
export type Tier = "anonymous" | "free" | "pro" | "business" | "admin";

export type Feature =
  | "signedPasses"
  | "customDomains"
  | "dynamicUpdates"
  | "analytics"
  | "clientPortals"
  | "bulkPersonalization"
  | "api"
  | "whiteLabel"
  | "multipleBrands"
  | "teamCollaboration";

const ALL: Feature[] = ["signedPasses", "customDomains", "dynamicUpdates", "analytics", "clientPortals", "bulkPersonalization", "api", "whiteLabel", "multipleBrands", "teamCollaboration"];

// ponytail: broad access for every tier until paid plans exist.
const MATRIX: Record<Tier, ReadonlySet<Feature>> = {
  anonymous: new Set(ALL),
  free: new Set(ALL),
  pro: new Set(ALL),
  business: new Set(ALL),
  admin: new Set(ALL),
};

export const can = (tier: Tier, feature: Feature) => MATRIX[tier].has(feature);
