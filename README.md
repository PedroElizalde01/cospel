# Cospel

Design, preview and publish Apple Wallet passes from the browser.

Two surfaces share one pass engine:

- **Public playground** (`/create`): no account, designs stay in the browser (IndexedDB)
- **Studio** (`/studio`): client, brand-kit and publishing workflow for agencies (Phase 3)

Everything builds and runs on Linux. No macOS is needed at any step.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Landing, playground, builder, previews, fields, colors, images, barcodes, local drafts, templates, JSON export/import | Done |
| 2 | Server-side signing, `.pkpass` generation, hosted `/p/[publicId]`, Add to Wallet flow | Interfaces only (`src/server/signing.ts`) |
| 3 | Studio, auth, PostgreSQL, clients, brand kits, versions, review links, analytics, marketing kit | Accounts, businesses, saved passes and image uploads done; the rest pending |
| 4 | Dynamic updates, device registrations, CSV personalization, API, white label | Data model only |

## Local development

Requirements: Node 22+, pnpm 10.

```bash
pnpm install
pnpm dev              # http://localhost:3000
```

The playground needs no database and no certificates.

### Checks

```bash
pnpm typecheck
pnpm lint
pnpm test             # Vitest: mapper, validator, project files
pnpm test:e2e         # Playwright: builder and marketing flows (starts its own dev server on :3200)
```

First Playwright run: `pnpm exec playwright install chromium` (add `--with-deps` on a fresh Linux box).

### Accounts and database (Studio)

The playground needs nothing. Studio (`/studio`) needs Postgres and an auth secret.

- Database: Neon, connected through the Vercel integration (`DATABASE_URL` pooled, `DATABASE_URL_UNPOOLED` direct).
- Accounts: Better Auth (email + password), stored in the same database.
- Images uploaded in Studio are stored in Postgres (`PassAsset.data`) for now.

```bash
vercel env pull .env.local        # DATABASE_URL, DATABASE_URL_UNPOOLED, BETTER_AUTH_SECRET
pnpm db:migrate                   # apply prisma/migrations (uses the direct URL)
pnpm dev
```

Local Postgres instead of Neon:

```bash
docker run -d --name cospel-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17-alpine
# set DATABASE_URL and DATABASE_URL_UNPOOLED to postgresql://postgres:postgres@localhost:5432/postgres
```

New migrations are applied manually with `pnpm db:migrate` before deploying code that needs them.

### Apple Wallet signing (Phase 2)

1. In the Apple Developer portal, create a Pass Type ID, e.g. `pass.com.yourcompany.loyalty`.
2. Create a CSR on Linux: `openssl req -new -newkey rsa:2048 -nodes -keyout secrets/pass.key -out secrets/pass.csr`.
3. Upload the CSR, download `pass.cer`, convert: `openssl x509 -inform der -in pass.cer -out secrets/pass.pem`.
4. Download Apple's WWDR intermediate (G4) and convert it the same way to `secrets/wwdr.pem`.
5. Set `PASS_TYPE_IDENTIFIER`, `APPLE_TEAM_IDENTIFIER`, `PASS_SIGNER_CERT`, `PASS_SIGNER_KEY`, `APPLE_WWDR_CERT` in `.env`.

`secrets/` is git-ignored. Keys are read only by server code (`src/server`, guarded by `server-only`).

## Architecture

```
Visual editor (src/components/builder)
        │  Zustand store, immer recipes, undo/redo history
        ▼
PassProject  (src/lib/pass/schema.ts)        canonical, versioned, Zod-validated
        │
        ├─► validateProject  (validate.ts)   errors / warnings / suggestions, each linked to a control
        ├─► WalletPassPreview (components/pass) visual simulation
        └─► toPassJson       (mapper.ts)     Apple pass.json; same field limits as the preview
                │
                ▼
        Phase 2: images @1x/2x/3x (Sharp) → manifest → signature → .pkpass
```

Key rules live in `src/lib/pass/styles.ts` (`STYLE_SPECS`): which field groups and images each Wallet style supports, field limits, the shared secondary/auxiliary row, and the iOS 27 Poster Generic fallback. Preview and mapper both use `visibleFields()`, so they can't disagree.

```
src/
  app/(marketing)/      landing, templates, examples, pricing, for-business, docs, legal
  app/create/           playground start screen and editor (/create/[id])
  components/builder/   editor shell, panels, inspector, cropper, preview canvas
  components/pass/      WalletPassPreview, face/details/watch/context renderers, barcodes
  lib/pass/             schema, styles, mapper, validator, factory, project files
  lib/storage/          Dexie (IndexedDB) drafts and image blobs
  lib/templates/        system templates (fictional brands, art in public/templates)
  lib/flags.ts          plan feature flags (all on for now)
  server/               server-only code (signing identity lookup)
prisma/                 PostgreSQL schema and migrations
tests/unit, tests/e2e   Vitest and Playwright
```

### Project files

`Export project` writes a `.walletpassproject` JSON file: `{ format, schemaVersion, exportedAt, project, assets }`, with images embedded as PNG/JPEG/WebP data URLs. Imports are validated and migrated through `migrateProject`.

### Notes

- Template art is SVG. Wallet requires PNG; Phase 2 rasterizes with Sharp.
- `posterGeneric` (iOS 27) is emitted together with a `generic` fallback using the same field keys. Its preview is an approximation of Apple's layout.
- Poster Event Tickets require Apple's NFC entitlement and aren't offered.

Apple and Apple Wallet are trademarks of Apple Inc. This project is not affiliated with Apple.
