import { db } from "@/server/db";
import { getSession } from "@/server/session";

/** Serves a workspace image to members of that workspace. Ids are random; content never changes. */
export async function GET(_req: Request, ctx: RouteContext<"/api/assets/[id]">) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const asset = await db.passAsset.findFirst({
    where: { id, workspace: { members: { some: { userId: session.user.id } } } },
    select: { data: true, mime: true },
  });
  if (!asset?.data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(asset.data), {
    headers: { "Content-Type": asset.mime, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
