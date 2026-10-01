import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/page-header";
import { TRADEMARK_NOTE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms" />
      <div className="mx-auto max-w-2xl space-y-5 px-4 pb-24 leading-relaxed text-muted-foreground sm:px-6 [&_h2]:pt-4 [&_h2]:font-medium [&_h2]:text-foreground">
        <h2>Your content</h2>
        <p>You own your designs. Only upload logos and images you have the right to use.</p>
        <h2>Apple Wallet</h2>
        <p>Signed passes require an Apple Developer account and a Pass Type ID certificate. You&apos;re responsible for complying with Apple&apos;s terms for the passes you issue.</p>
        <h2>Barcodes</h2>
        <p>A barcode contains the data you specify. Redeeming it depends on your own systems.</p>
        <h2>Availability</h2>
        <p>The playground is provided as is. Export your projects if you need a backup; browser storage can be cleared.</p>
        <p className="text-xs">{TRADEMARK_NOTE}</p>
      </div>
    </>
  );
}
