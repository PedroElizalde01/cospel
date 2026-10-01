import type { Metadata } from "next";
import { ExampleGrid } from "@/components/marketing/example-grid";
import { PageHeader } from "@/components/marketing/page-header";
import { EXAMPLES, getTemplate } from "@/lib/templates";

export const metadata: Metadata = { title: "Examples", description: "Fictional businesses using Apple Wallet passes designed with Cospel." };

export default function ExamplesPage() {
  const items = EXAMPLES.map((e) => ({ ...e, project: getTemplate(e.slug)!.build() }));
  return (
    <>
      <PageHeader eyebrow="Examples" title="What businesses put in Wallet.">
        Fictional brands, real Wallet layouts. Open any example to see the front and details, then make it yours.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <ExampleGrid items={items} />
      </div>
    </>
  );
}
