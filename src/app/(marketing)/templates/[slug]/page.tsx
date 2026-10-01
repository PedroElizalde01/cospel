import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PassShowcase } from "@/components/marketing/pass-showcase";
import { Button } from "@/components/ui/button";
import { STYLE_SPECS } from "@/lib/pass/styles";
import { TEMPLATES, getTemplate } from "@/lib/templates";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/templates/[slug]">): Promise<Metadata> {
  const t = getTemplate((await params).slug);
  return t ? { title: `${t.name} template`, description: t.description } : {};
}

export default async function TemplatePage({ params }: PageProps<"/templates/[slug]">) {
  const t = getTemplate((await params).slug);
  if (!t) notFound();
  const project = t.build();
  const spec = STYLE_SPECS[project.style];
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 md:grid-cols-[1fr_380px] md:py-20">
      <div className="flex justify-center rounded-3xl bg-muted/50 px-4 py-12">
        <PassShowcase project={project} />
      </div>
      <div className="space-y-6">
        <Link href="/templates" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All templates
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">{t.category}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{t.name}</h1>
          <p className="mt-3 text-muted-foreground">{t.description}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-border/70 p-4 text-sm">
          <div><dt className="text-muted-foreground">Pass type</dt><dd className="font-medium">{spec.name}</dd></div>
          <div><dt className="text-muted-foreground">Business</dt><dd className="font-medium">{t.businessType}</dd></div>
          <div className="col-span-2"><dt className="text-muted-foreground">Tags</dt><dd className="mt-1 flex flex-wrap gap-1">{t.tags.map((x) => <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-xs">{x}</span>)}</dd></div>
        </dl>
        <Button asChild size="lg" className="h-11 w-full text-base">
          <Link href={`/create?template=${t.slug}`}>Use this template</Link>
        </Button>
        <p className="text-xs text-muted-foreground">Opens in the editor. No account needed.</p>
      </div>
    </div>
  );
}
