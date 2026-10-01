"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function PanelHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="space-y-1 px-4 pt-4 pb-2">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
      {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}

export function Section({ title, hint, actions, children, className }: { title?: string; hint?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-3 border-b border-border/60 px-4 py-4 last:border-b-0", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {title}
            {hint && <HintIcon>{hint}</HintIcon>}
          </h3>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function HintIcon({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="rounded-full text-muted-foreground/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" aria-label="More info">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}

export function FormRow({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-xs font-normal text-foreground/80">{label}</Label>
        {hint && <HintIcon>{hint}</HintIcon>}
      </div>
      {children}
    </div>
  );
}

/** Compact segmented control with radio semantics. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "sm",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  label: string;
  className?: string;
  size?: "sm" | "xs";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-lg bg-muted p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&_svg]:size-3.5",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-6 px-2 text-[11px]",
            value === o.value && "bg-background text-foreground shadow-sm",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
