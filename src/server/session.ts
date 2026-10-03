import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { db } from "./db";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Signed-in user or redirect to login. */
export async function requireUser(next = "/studio") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session.user;
}

/**
 * The user's workspace (business). Every Studio query is scoped by it.
 * ponytail: one workspace per user for now; add a workspace switcher for agencies with several.
 */
export const requireWorkspace = cache(async (next = "/studio") => {
  const user = await requireUser(next);
  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) redirect("/onboarding");
  return { user, workspace: membership.workspace, role: membership.role };
});
