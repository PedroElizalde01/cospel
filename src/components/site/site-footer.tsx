import Link from "next/link";
import { TRADEMARK_NOTE } from "@/lib/site";
import { Logo } from "./logo";

const COLS = [
  { title: "Product", links: [["Create a pass", "/create"], ["Templates", "/templates"], ["Examples", "/examples"], ["Pricing", "/pricing"]] },
  { title: "Business", links: [["For business", "/for-business"], ["Have us build it", "/for-business#contact"]] },
  { title: "Resources", links: [["Docs", "/docs"], ["Certificates", "/docs#certificates"], ["API", "/docs#api"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Designs stay in your browser until you generate or share them.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="mb-3 text-xs font-medium text-muted-foreground">{c.title}</h2>
            <ul className="space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-foreground/80 hover:text-foreground">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">{TRADEMARK_NOTE}</p>
    </footer>
  );
}
