import { cn } from "@/lib/utils";

/** Cospel mark: the old Buenos Aires subway token, a coin with a slot. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-[-0.02em]", className)}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <circle cx="12" cy="12" r="10" className="fill-foreground" />
        <circle cx="12" cy="12" r="7.25" fill="none" strokeWidth="1" className="stroke-background/40" />
        <rect x="6.5" y="10.75" width="11" height="2.5" rx="1.25" className="fill-background" />
      </svg>
      Cospel
    </span>
  );
}
