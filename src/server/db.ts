import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server instance; reused across hot reloads in development.
// Standard Postgres driver: works with Neon's pooled URL and with a local Postgres for tests.
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForDb.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

if (process.env.NODE_ENV !== "production") globalForDb.prisma = db;
