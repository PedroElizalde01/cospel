import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/session";

const MAX_BYTES = 4 * 1024 * 1024; // under Vercel's 4.5 MB request limit
const MAX_SIDE = 4096;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Reads PNG dimensions from the IHDR chunk. The editor always uploads cropped PNGs. */
function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || PNG_SIGNATURE.some((b, i) => buf[i] !== b) || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const member = await db.workspaceMember.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
  if (!member) return NextResponse.json({ error: "Create your business first." }, { status: 403 });

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be 4 MB or smaller." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const size = pngSize(buf);
  if (!size || size.width < 1 || size.height < 1 || size.width > MAX_SIDE || size.height > MAX_SIDE) {
    return NextResponse.json({ error: "Upload a PNG image up to 4096×4096." }, { status: 415 });
  }
  const asset = await db.passAsset.create({
    data: {
      workspaceId: member.workspaceId,
      kind: "image",
      filename: "image.png",
      mime: "image/png",
      width: size.width,
      height: size.height,
      bytes: buf.length,
      storageKey: `db:${crypto.randomUUID()}`,
      sha256: createHash("sha256").update(buf).digest("hex"),
      data: buf,
    },
    select: { id: true, width: true, height: true },
  });
  return NextResponse.json({ url: `/api/assets/${asset.id}`, width: asset.width, height: asset.height });
}
