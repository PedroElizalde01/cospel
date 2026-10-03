import type { Metadata } from "next";
import { Builder } from "@/components/builder/builder";
import { getSigningStatus } from "@/server/signing";
import { requireWorkspace } from "@/server/session";

export const metadata: Metadata = { title: "Editor", robots: { index: false } };

export default async function StudioEditorPage({ params }: PageProps<"/studio/passes/[id]">) {
  const { id } = await params;
  await requireWorkspace(`/studio/passes/${id}`);
  return <Builder draftId={id} mode="account" signingAvailable={getSigningStatus().configured} />;
}
