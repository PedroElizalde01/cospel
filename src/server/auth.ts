import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

const vercel = (host?: string) => (host ? `https://${host}` : undefined);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL ?? vercel(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? "http://localhost:3000",
  // Preview deployments get their own URLs.
  trustedOrigins: [vercel(process.env.VERCEL_URL), vercel(process.env.VERCEL_BRANCH_URL)].filter((x): x is string => !!x),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  // nextCookies must be last: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
