import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/page-header";
import { TemplateGallery } from "@/components/marketing/template-gallery";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Apple Wallet pass templates",
  description: "Free Apple Wallet templates for loyalty cards, memberships, event tickets, coupons, gift cards and boarding passes. Customize in your browser.",
};

export default function TemplatesPage() {
  const items = TEMPLATES.map(({ build, ...meta }) => ({ meta, project: build() }));
  return (
    <>
      <PageHeader eyebrow="Templates" title="Start from a polished design.">
        Every template follows Apple Wallet&apos;s real layouts. Open one, make it yours, and keep it in your browser.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <TemplateGallery items={items} categories={TEMPLATE_CATEGORIES} />
      </div>
    </>
  );
}
