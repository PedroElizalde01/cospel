import type { Metadata } from "next";
import { Builder } from "@/components/builder/builder";
import { getSigningStatus } from "@/server/signing";

export const metadata: Metadata = { title: "Editor", robots: { index: false } };

export default async function EditorPage({ params }: PageProps<"/create/[id]">) {
  const { id } = await params;
  return <Builder draftId={id} signingAvailable={getSigningStatus().configured} />;
}
