import { ArrowRight, Braces, Building2, Globe, Laptop, Layers, MousePointerClick, QrCode, Share2, ShieldCheck, Smartphone, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { HeroPasses } from "@/components/marketing/hero-passes";
import { InteractiveDemo } from "@/components/marketing/interactive-demo";
import { TemplateCard } from "@/components/marketing/template-gallery";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import { Button } from "@/components/ui/button";
import { toPassJson } from "@/lib/pass/mapper";
import { PASS_STYLES } from "@/lib/pass/schema";
import { STYLE_SPECS } from "@/lib/pass/styles";
import { TEMPLATES, getTemplate } from "@/lib/templates";

const STYLE_SAMPLE: Record<(typeof PASS_STYLES)[number], string> = {
  storeCard: "coffee-loyalty",
  generic: "gym-membership",
  eventTicket: "event-ticket",
  coupon: "retail-discount",
  boardingPass: "boarding-pass",
  posterGeneric: "poster-membership",
};

const STEPS = [
  { icon: MousePointerClick, title: "Pick a starting point", text: "Loyalty, membership, ticket, coupon. Choose what you're making. We pick the right Wallet layout." },
  { icon: Layers, title: "Design with a live preview", text: "Edit text, colors, images and the barcode. The Wallet preview updates as you type." },
  { icon: Wallet, title: "Publish to both wallets", text: "Share a link or QR code. iPhone users add it to Apple Wallet, Android users to Google Wallet, in one tap." },
];

const USE_CASES = [
  { title: "Cafés & restaurants", text: "Stamp cards and points that live on the lock screen, not in a drawer." },
  { title: "Gyms & clubs", text: "Membership cards with door-access codes and renewal dates." },
  { title: "Events & venues", text: "Tickets with gate, section and seat. Gate changes can notify attendees." },
  { title: "Retail", text: "Coupons and gift cards your staff scan at checkout." },
  { title: "Campuses & teams", text: "Student IDs and staff badges that are always in reach." },
  { title: "Hotels & culture", text: "Guest status and museum memberships with a premium feel." },
];

const FAQ = [
  { q: "Do I need an iPhone or a Mac to design a pass?", a: "No. Cospel runs in any modern browser on any computer, including Linux and Windows. Your customers add the finished pass on their iPhone or Android phone." },
  { q: "Does it work on Android?", a: "Yes. Every design has a Google Wallet version for Android, generated from the same content. Google uses its own card layout, so the editor shows both previews side by side." },
  { q: "Is it free?", a: "Designing, previewing, saving locally and exporting are free with no account. Issuing real Apple Wallet passes requires an Apple Developer certificate; Google Wallet requires a Google Wallet issuer account." },
  { q: "Where are my designs stored?", a: "In your browser (IndexedDB). Designs and images stay on your device until you generate or share them." },
  { q: "Can I put any layout I want on a pass?", a: "Apple Wallet uses fixed templates. You control content, field order, colors, images and the barcode. Wallet controls the final layout. Cospel shows exactly that, instead of pretending otherwise." },
  { q: "Does the barcode connect to my point-of-sale system?", a: "The code contains the data you choose, such as a member ID. Your business system must know how to interpret or redeem it." },
  { q: "Can you build passes for my business?", a: "Yes. We design, set up and deliver branded passes, QR posters and links. Tell us what you need on the business page." },
];

export default function HomePage() {
  const hero = [
    { project: getTemplate("coffee-loyalty")!.build(), platform: "google" as const },
    { project: getTemplate("gym-membership")!.build(), platform: "apple" as const },
    { project: getTemplate("coffee-loyalty")!.build(), platform: "apple" as const },
  ];
  const featured = TEMPLATES.slice(0, 6).map(({ build, ...meta }) => ({ meta, project: build() }));
  const sample = toPassJson(getTemplate("coffee-loyalty")!.build());
  const store = sample.storeCard as Record<string, unknown>;
  const jsonSample = JSON.stringify(
    { organizationName: sample.organizationName, backgroundColor: sample.backgroundColor, storeCard: { headerFields: store.headerFields, primaryFields: store.primaryFields } },
    null,
    2,
  );

  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              <Laptop className="size-3.5" /> Apple Wallet and Google Wallet. No app, no Mac.
            </p>
            <h1 className="text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">Create beautiful wallet passes.</h1>
            <p className="mt-5 max-w-lg text-lg text-pretty text-muted-foreground">
              Design, preview and publish loyalty cards, memberships, event tickets and more for iPhone and Android, directly from your browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link href="/create">Create a pass <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
                <Link href="/examples">See examples</Link>
              </Button>
            </div>
            <ul className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Sparkles className="size-4" /> Live Wallet preview</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-4" /> Designs stay local</li>
              <li className="flex items-center gap-2"><Building2 className="size-4" /> Branded for business</li>
              <li className="flex items-center gap-2"><Smartphone className="size-4" /> iPhone and Android</li>
            </ul>
          </div>
          <HeroPasses passes={hero} />
        </div>
      </section>

      {/* 2. Interactive preview */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="try">
        <div className="mb-8 max-w-xl">
          <h2 id="try" className="text-3xl font-semibold tracking-[-0.03em]">Try it right here.</h2>
          <p className="mt-2 text-muted-foreground">Type a name, pick a color, switch between Apple Wallet and Google Wallet. That&apos;s the editor&apos;s real preview engine.</p>
        </div>
        <InteractiveDemo />
      </section>

      {/* 3. Supported pass types */}
      <section className="border-y border-border/60 bg-muted/30" aria-labelledby="types">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="types" className="text-3xl font-semibold tracking-[-0.03em]">Every Wallet pass type.</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">Designed on Apple&apos;s real layout rules, including the new iOS 27 Poster style. Every design also renders as a Google Wallet pass for Android.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
            {PASS_STYLES.map((s) => (
              <div key={s} className="overflow-hidden rounded-2xl border border-border/70 bg-background">
                <div className="flex h-48 items-start justify-center overflow-hidden pt-5">
                  <WalletPassPreview project={getTemplate(STYLE_SAMPLE[s])!.build()} scale={0.55} />
                </div>
                <div className="border-t border-border/60 p-4">
                  <div className="font-medium">{STYLE_SPECS[s].name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{STYLE_SPECS[s].summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="text-3xl font-semibold tracking-[-0.03em]">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border/70 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted"><s.icon className="size-4" /></span>
                <span className="text-sm text-muted-foreground tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-medium">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. Use cases */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" aria-labelledby="uses">
        <h2 id="uses" className="text-3xl font-semibold tracking-[-0.03em]">Made for real businesses</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => (
            <div key={u.title} className="bg-background p-6">
              <h3 className="font-medium">{u.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{u.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Templates */}
      <section className="border-y border-border/60 bg-muted/30" aria-labelledby="tpl">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="tpl" className="text-3xl font-semibold tracking-[-0.03em]">Start from a template</h2>
              <p className="mt-2 text-muted-foreground">Polished starting points for common businesses.</p>
            </div>
            <Button asChild variant="outline"><Link href="/templates">All templates <ArrowRight /></Link></Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((i) => <TemplateCard key={i.meta.slug} item={i} href={`/templates/${i.meta.slug}`} />)}
          </div>
        </div>
      </section>

      {/* 7. Business offering */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="biz">
        <div className="grid gap-10 rounded-3xl bg-foreground p-8 text-background sm:p-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 id="biz" className="text-3xl font-semibold tracking-[-0.03em]">Want us to build it for you?</h2>
            <p className="mt-3 max-w-md text-background/70">
              We design your pass, set up signing, and hand over everything you need to launch: a direct link, an Add to Apple Wallet page and printable QR posters.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary"><Link href="/for-business#contact">Have us build it</Link></Button>
              <Button asChild variant="ghost" className="text-background hover:bg-background/10 hover:text-background"><Link href="/for-business">Learn more</Link></Button>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-background/80">
            {[
              [Building2, "Your brand, applied consistently"],
              [Share2, "Review links your client can approve"],
              [QrCode, "QR posters, table signs and stickers"],
              [Globe, "Hosted pass pages that work on any device"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Building2;
              return (
                <li key={t as string} className="flex items-center gap-3"><I className="size-4 shrink-0" /> {t as string}</li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 8. Developer teaser */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" aria-labelledby="dev">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground"><Braces className="size-4" /> For developers</p>
            <h2 id="dev" className="text-3xl font-semibold tracking-[-0.03em]">The design is the data.</h2>
            <p className="mt-3 text-muted-foreground">
              The visual editor produces the same structured data used to generate the real pass. Inspect the live pass.json in the editor, export projects as JSON, and soon create passes through an API.
            </p>
            <Button asChild variant="link" className="mt-2 px-0"><Link href="/docs#api">Read the API notes <ArrowRight /></Link></Button>
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/40 p-5 font-mono text-xs leading-relaxed">{jsonSample}</pre>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="border-t border-border/60" aria-labelledby="faq">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.6fr]">
          <h2 id="faq" className="text-3xl font-semibold tracking-[-0.03em]">Questions</h2>
          <Faq items={FAQ} />
        </div>
      </section>

      {/* 10. CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-center rounded-3xl border border-border/70 px-6 py-16 text-center">
          <h2 className="text-4xl font-semibold tracking-[-0.035em] text-balance">Your first pass takes minutes.</h2>
          <p className="mt-3 text-muted-foreground">No account. No app. Designs stay in your browser.</p>
          <Button asChild size="lg" className="mt-8 h-11 px-6 text-base"><Link href="/create">Create a pass <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
