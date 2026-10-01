import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-20">
      {eyebrow && <p className="mb-3 text-sm font-medium text-muted-foreground">{eyebrow}</p>}
      <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">{children}</div>}
    </div>
  );
}
