import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { BARCODE_SPECS } from "@/lib/pass/barcode";
import { BARCODE_FORMATS, PASS_STYLES } from "@/lib/pass/schema";
import { STYLE_SPECS } from "@/lib/pass/styles";

export const metadata: Metadata = { title: "Docs", description: "How to design, publish and manage Apple Wallet passes with Cospel." };

const SECTIONS = [
  ["getting-started", "Getting started"],
  ["pass-types", "Pass types"],
  ["design", "Design"],
  ["barcodes", "Barcodes"],
  ["publishing", "Publishing"],
  ["certificates", "Apple Wallet certificates"],
  ["google-wallet", "Google Wallet (Android)"],
  ["client-workflows", "Client workflows"],
  ["dynamic-passes", "Dynamic passes"],
  ["api", "API"],
] as const;

export default function DocsPage() {
  return (
    <>
      <PageHeader eyebrow="Docs" title="How Wallet passes work, in plain words." />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 sm:px-6 md:grid-cols-[200px_1fr]">
        <nav aria-label="Docs" className="md:sticky md:top-20 md:self-start">
          <ul className="space-y-1 text-sm">
            {SECTIONS.map(([id, t]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">{t}</a></li>
            ))}
          </ul>
        </nav>
        <article className="max-w-2xl space-y-14 leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:space-y-1.5">
          <section>
            <h2 id="getting-started">Getting started</h2>
            <p>Open <Link href="/create" className="underline">Create a pass</Link>, choose what you&apos;re making and edit. The preview on the right is what Wallet will show. Everything saves automatically in your browser. No account needed.</p>
            <p>Use <strong>Export project</strong> to save a <code>.walletpassproject</code> file you can import on another computer.</p>
          </section>
          <section>
            <h2 id="pass-types">Pass types</h2>
            <p>Apple Wallet has a fixed set of layouts. You pick content and order; Wallet decides positions. That&apos;s why there are no x/y controls.</p>
            <ul>
              {PASS_STYLES.map((s) => (
                <li key={s}><strong>{STYLE_SPECS[s].name}</strong>: {STYLE_SPECS[s].summary} Images: {STYLE_SPECS[s].images.join(", ")}.</li>
              ))}
            </ul>
            <p>Store cards, coupons and generic passes with a square barcode fit at most four secondary and auxiliary fields together. The editor warns you instead of silently dropping them.</p>
          </section>
          <section>
            <h2 id="design">Design</h2>
            <p>Three colors control a pass: background, text and labels. They never change with the viewer&apos;s light or dark mode. Keep text contrast at 4.5:1 or higher.</p>
            <p>Images are cropped in your browser. When you generate a pass, the server renders @1x, @2x and @3x PNG files. Apple requires an <strong>icon</strong>; the logo is strongly recommended.</p>
            <p><strong>Wallet accuracy</strong> (on by default) shows exactly what Wallet renders. Turn it off for a sandbox that draws hidden fields in red. The generated pass always follows Apple&apos;s rules.</p>
          </section>
          <section>
            <h2 id="barcodes">Barcodes</h2>
            <p>The code contains the data you specify. Your business system must know how to interpret or redeem it.</p>
            <ul>
              {BARCODE_FORMATS.map((f) => (
                <li key={f}><strong>{BARCODE_SPECS[f].name}</strong>: {BARCODE_SPECS[f].minIOS >= 27 ? "iOS 27 and later. Add a fallback format for older devices." : "all supported Wallet versions."}{BARCODE_SPECS[f].watch ? "" : " Not shown on Apple Watch."}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 id="publishing">Publishing</h2>
            <p>Generating a pass validates the design, processes images, writes <code>pass.json</code> and <code>manifest.json</code>, signs the bundle and produces a <code>.pkpass</code> file served as <code>application/vnd.apple.pkpass</code>. Each published pass gets a page with an Add to Apple Wallet button on iPhone and a QR code everywhere else.</p>
            <p>This needs a signing certificate on the server. Without one, the playground runs in preview mode.</p>
          </section>
          <section>
            <h2 id="certificates">Apple Wallet certificates</h2>
            <ul>
              <li>In your Apple Developer account, create a <strong>Pass Type ID</strong> (e.g. <code>pass.com.yourcompany.loyalty</code>).</li>
              <li>Create a certificate for it. You can generate the CSR on Linux with <code>openssl req -new -newkey rsa:2048 -nodes -keyout pass.key -out pass.csr</code>.</li>
              <li>Download the certificate and Apple&apos;s <strong>WWDR</strong> intermediate certificate.</li>
              <li>Convert to PEM: <code>openssl x509 -inform der -in pass.cer -out pass.pem</code>.</li>
              <li>Configure the server with the Pass Type ID, your Team ID and the file paths (see the README). Private keys never reach the browser and are encrypted at rest when stored in the database.</li>
            </ul>
          </section>
          <section>
            <h2 id="google-wallet">Google Wallet (Android)</h2>
            <p>Every design also renders as a Google Wallet pass. Switch the preview to <strong>Google Wallet</strong> in the editor to see it. Google uses its own layout, so the same content looks different:</p>
            <ul>
              <li>The logo is shown inside a circle. Use a square logo with some margin.</li>
              <li>The card shows a title, one large header (your primary field), up to 6 more fields in rows of two, the barcode, and a hero image at the bottom (your strip or artwork).</li>
              <li>Text is white or black automatically, based on the background color. The label color only applies to Apple Wallet.</li>
              <li>Fields that don&apos;t fit on the card appear in pass details.</li>
            </ul>
            <p>Issuing real Google Wallet passes needs a Google Wallet issuer account (Google Pay &amp; Wallet Console) and a Google Cloud service account. New accounts start in demo mode until Google approves publishing.</p>
          </section>
          <section>
            <h2 id="client-workflows">Client workflows</h2>
            <p>The Studio is built for agencies: keep each client&apos;s brand kit, create passes in minutes, send a review link the client can approve without an account, then publish and hand over a link, an Add to Wallet page and a QR marketing kit.</p>
          </section>
          <section>
            <h2 id="dynamic-passes">Dynamic passes</h2>
            <p>Wallet passes can update in place: points from 42 to 50, a tier from Silver to Gold, a gate from A to B. Add a <strong>change message</strong> with <code>%@</code> to a field and Wallet shows a notification when it changes. Updates require a web service registered with each device.</p>
          </section>
          <section>
            <h2 id="api">API</h2>
            <p>The design is structured data: the same project the editor saves maps to <code>pass.json</code>. The planned API creates passes from templates with variables like <code>{"{{customer.name}}"}</code>, authenticated with workspace API keys.</p>
          </section>
        </article>
      </div>
    </>
  );
}
