import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateHome } from "@/components/create/create-home";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Create a pass",
  description: "Design an Apple Wallet pass in your browser. No account needed.",
};

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Suspense>
          <CreateHome />
        </Suspense>
      </main>
    </>
  );
}
