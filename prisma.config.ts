import { defineConfig } from "prisma/config";

// Load .env for the CLI without an extra dependency (Node 21+). Next.js loads it on its own.
try {
  process.loadEnvFile();
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
