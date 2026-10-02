import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing", description: "Design Apple Wallet passes for free. Managed services for businesses." };

const PLANS = [
  {
    name: "Playground",
    price: "Free",
    note: "No account",
    cta: { label: "Create a pass", href: "/create" },
    features: ["Unlimited designs", "Apple Wallet and Google Wallet previews", "All pass types and templates", "Save in your browser", "Export and import projects", "Live pass.json inspector"],
  },
  {
    name: "Pro",
    price: "Coming soon",
    note: "For freelancers and small teams",
    cta: { label: "Get notified", href: "/for-business#contact" },
    features: ["Real passes for Apple Wallet and Google Wallet", "Hosted pass pages and QR codes", "Brand kits", "Client review links", "Basic analytics"],
  },
  {
    name: "Business",
    price: "Let's talk",
    note: "Done for you",
    cta: { label: "Have us build it", href: "/for-business#contact" },
    features: ["Design and setup by our team", "Your own signing identity", "Marketing kit: posters, signs, stickers", "Pass updates (points, tiers, gates)", "Bulk personalization from CSV"],
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Free to design. Pay when you go live.">
        The playground stays genuinely useful for free. Paid plans cover signing, hosting and client work.
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <div key={p.name} className={`flex flex-col rounded-3xl border p-6 ${i === 0 ? "border-foreground/80" : "border-border/70"}`}>
            <div className="text-sm text-muted-foreground">{p.name}</div>
            <div className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{p.price}</div>
            <div className="text-sm text-muted-foreground">{p.note}</div>
            <ul className="my-6 flex-1 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {f}</li>
              ))}
            </ul>
            <Button asChild variant={i === 0 ? "default" : "outline"}><Link href={p.cta.href}>{p.cta.label}</Link></Button>
          </div>
        ))}
      </div>
    </>
  );
}
