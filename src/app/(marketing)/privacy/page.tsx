import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/page-header";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy" />
      <div className="mx-auto max-w-2xl space-y-5 px-4 pb-24 leading-relaxed text-muted-foreground sm:px-6 [&_h2]:pt-4 [&_h2]:font-medium [&_h2]:text-foreground">
        <h2>Designs stay in your browser</h2>
        <p>The playground stores designs and images in your browser&apos;s IndexedDB. They aren&apos;t sent to our servers while you edit, preview, save, export or import.</p>
        <h2>When data leaves your browser</h2>
        <p>Only when you explicitly generate a signed pass or share a design. Then we receive the design and the images needed to build the pass.</p>
        <h2>Contact form</h2>
        <p>If you contact us, we receive what you submit (company, name, email and message) and use it only to reply.</p>
        <h2>Analytics</h2>
        <p>The playground runs no third-party analytics. When hosted pass pages launch, they will count page views and pass downloads with referrer and campaign parameters, without fingerprinting visitors. This page will be updated first.</p>
        <h2>Cookies</h2>
        <p>We use local storage for editor preferences such as theme and recent colors. No advertising cookies.</p>
      </div>
    </>
  );
}
