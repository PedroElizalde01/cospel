import "server-only";

/**
 * Signing identity lookup. Phase 1 reads environment variables only;
 * Phase 2 adds per-workspace identities from the database (encrypted at rest),
 * so nothing here assumes a single global pass type identifier.
 */
export interface SigningStatus {
  configured: boolean;
  passTypeIdentifier?: string;
  teamIdentifier?: string;
}

export function getSigningStatus(): SigningStatus {
  const { PASS_TYPE_IDENTIFIER, APPLE_TEAM_IDENTIFIER, PASS_SIGNER_CERT, PASS_SIGNER_KEY, APPLE_WWDR_CERT } = process.env;
  const configured = Boolean(PASS_TYPE_IDENTIFIER && APPLE_TEAM_IDENTIFIER && PASS_SIGNER_CERT && PASS_SIGNER_KEY && APPLE_WWDR_CERT);
  // ponytail: generation endpoint lands in Phase 2; until then signed mode stays off even with env set.
  return configured ? { configured: false, passTypeIdentifier: PASS_TYPE_IDENTIFIER, teamIdentifier: APPLE_TEAM_IDENTIFIER } : { configured: false };
}
