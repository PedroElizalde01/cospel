"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cloneProject, starterProject } from "@/lib/pass/factory";
import { PassProjectSchema, type PassProject } from "@/lib/pass/schema";
import { PURPOSES, type PurposeId } from "@/lib/pass/styles";
import { getTemplate } from "@/lib/templates";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { requireUser, requireWorkspace } from "./session";

const MAX_DESIGN_BYTES = 1_000_000;

/** Validates untrusted design JSON from the browser. */
function parseDesign(input: unknown): PassProject {
  if (JSON.stringify(input).length > MAX_DESIGN_BYTES) throw new Error("Design is too large.");
  // Local browser images can't be stored server-side; uploads replace them with account URLs first.
  const p = PassProjectSchema.parse(input);
  for (const ref of Object.values(p.images)) {
    if (ref?.kind === "local") throw new Error("Upload images before saving to your account.");
    if (ref?.kind === "url" && !/^\/(templates|api\/assets)\//.test(ref.url)) throw new Error("Unsupported image URL.");
  }
  return p;
}

async function ownedPass(id: string) {
  const { workspace } = await requireWorkspace();
  const pass = await db.pass.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!pass) throw new Error("Pass not found.");
  return { pass, workspace };
}

async function insertPass(workspaceId: string, project: PassProject) {
  await db.pass.create({
    data: { id: project.id, workspaceId, name: project.name, style: project.style, design: project as unknown as Prisma.InputJsonValue },
  });
  revalidatePath("/studio");
  return project.id;
}

export async function createWorkspace(form: FormData) {
  const user = await requireUser("/onboarding");
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  if (!name) return;
  if (await db.workspaceMember.findFirst({ where: { userId: user.id } })) redirect("/studio");
  const slug = `${name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "business"}-${crypto.randomUUID().slice(0, 6)}`;
  await db.workspace.create({ data: { name, slug, members: { create: { userId: user.id, role: "owner" } } } });
  redirect("/studio");
}

export async function createPass(input: { purpose?: PurposeId; template?: string }) {
  const { workspace } = await requireWorkspace();
  let project: PassProject;
  if (input.template) {
    const t = getTemplate(input.template);
    if (!t) throw new Error("Template not found.");
    project = cloneProject(t.build(), { name: t.name });
  } else {
    const purpose = PURPOSES.find((p) => p.id === input.purpose)?.id ?? "blank";
    project = starterProject(purpose);
  }
  const id = await insertPass(workspace.id, project);
  redirect(`/studio/passes/${id}`);
}

/** "Save to my account" from the playground. Images must already be uploaded. */
export async function importPass(input: unknown) {
  const { workspace } = await requireWorkspace();
  const project = cloneProject(parseDesign(input));
  return insertPass(workspace.id, project);
}

export async function getPass(id: string): Promise<PassProject | null> {
  const { workspace } = await requireWorkspace();
  const pass = await db.pass.findFirst({ where: { id, workspaceId: workspace.id } });
  return pass ? PassProjectSchema.parse(pass.design) : null;
}

export async function savePass(input: unknown) {
  const project = parseDesign(input);
  await ownedPass(project.id);
  const stamped = { ...project, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } };
  await db.pass.update({
    where: { id: project.id },
    data: { name: stamped.name, style: stamped.style, design: stamped as unknown as Prisma.InputJsonValue },
  });
}

export async function duplicatePass(id: string) {
  const { pass, workspace } = await ownedPass(id);
  const copy = cloneProject(PassProjectSchema.parse(pass.design), { name: `${pass.name} copy` });
  return insertPass(workspace.id, copy);
}

export async function deletePass(id: string) {
  await ownedPass(id);
  await db.pass.delete({ where: { id } });
  revalidatePath("/studio");
}
