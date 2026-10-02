import { BadgeCheck, CalendarDays, CreditCard, Crown, Gift, IdCard, Percent } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/contact-form";
import { PageHeader } from "@/components/marketing/page-header";
import { WalletPassPreview } from "@/components/pass/wallet-pass-preview";
import { Button } from "@/components/ui/button";
import { getTemplate } from "@/lib/templates";

export const metadata: Metadata = { title: "For business", description: "Apple Wallet passes for loyalty programs, memberships, events, coupons and more. Do it yourself or have us build it." };

const CASES = [
  { icon: CreditCard, title: "Loyalty programs", text: "Stamps and points that update and notify." },
  { icon: BadgeCheck, title: "Memberships", text: "Gyms, clubs, coworking, museums." },
  { icon: CalendarDays, title: "Events", text: "Tickets with gate, section and seat." },
  { icon: Percent, title: "Coupons", text: "Offers customers actually keep." },
  { icon: IdCard, title: "Employee cards", text: "Badges for staff and contractors." },
  { icon: Crown, title: "VIP cards", text: "Status that feels premium." },
  { icon: Gift, title: "Gift cards", text: "Balance and card number, always at hand." },
];

const WORKFLOW = ["We meet and agree on the goal", "We apply your brand", "You review a live preview link", "You approve", "We generate the signed pass", "You get a link, an Add to Wallet page and QR posters"];

export default function ForBusinessPage() {
  return (
    <>
      <PageHeader eyebrow="For business" title="Put your brand in your customers' Wallet.">
        Passes for iPhone and Android sit on the lock screen, update in place and never get lost in an inbox. Build them yourself, or let us do it.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/create">Create your pass</Link></Button>
          <Button asChild size="lg" variant="outline"><a href="#contact">Have us build it for you</a></Button>
        </div>

        <section className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Use cases">
          {CASES.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border/70 p-5">
              <c.icon className="size-5 text-muted-foreground" />
              <h2 className="mt-4 font-medium">{c.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 grid items-center gap-10 md:grid-cols-2" aria-labelledby="workflow">
          <div>
            <h2 id="workflow" className="text-3xl font-semibold tracking-[-0.03em]">From first meeting to launch</h2>
            <ol className="mt-6 space-y-3">
              {WORKFLOW.map((w, i) => (
                <li key={w} className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs tabular-nums">{i + 1}</span>
                  {w}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex justify-center rounded-3xl bg-muted/50 py-10">
            <WalletPassPreview project={getTemplate("restaurant-rewards")!.build()} scale={0.85} />
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 py-20" aria-labelledby="contact-title">
          <h2 id="contact-title" className="text-3xl font-semibold tracking-[-0.03em]">Have us build it</h2>
          <p className="mt-2 mb-8 text-muted-foreground">Tell us a little about your business. We&apos;ll reply with a plan and a preview.</p>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
