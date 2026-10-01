"use client";

import { Bus, Plane, Ship, TrainFront, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PASS_STYLES, type PassStyle } from "@/lib/pass/schema";
import { STYLE_SPECS } from "@/lib/pass/styles";
import { cn } from "@/lib/utils";
import { useBuilder } from "../store";
import { FormRow, PanelHeader, Section, Segmented } from "../ui";

const TRANSIT = [
  { value: "air", label: <Plane />, title: "Air" },
  { value: "train", label: <TrainFront />, title: "Train" },
  { value: "bus", label: <Bus />, title: "Bus" },
  { value: "boat", label: <Ship />, title: "Boat" },
  { value: "generic", label: <ArrowRight />, title: "Other" },
] as const;

export function SettingsPanel() {
  const p = useBuilder((s) => s.project!);
  const accuracy = useBuilder((s) => s.accuracy);
  const update = useBuilder((s) => s.update);

  return (
    <>
      <PanelHeader title="Pass settings" />
      <Section title="Pass type" hint="Apple Wallet has a fixed set of layouts. Switching keeps your content; fields a layout can't show are flagged, not deleted.">
        <div role="radiogroup" aria-label="Pass type" className="grid grid-cols-2 gap-1.5">
          {PASS_STYLES.map((s: PassStyle) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={p.style === s}
              onClick={() => update((d) => void (d.style = s))}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                p.style === s ? "border-foreground/80 bg-muted" : "border-border/70 hover:border-foreground/30",
              )}
            >
              <div className="text-xs font-medium">{STYLE_SPECS[s].name}</div>
              <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{STYLE_SPECS[s].summary}</div>
            </button>
          ))}
        </div>
        {p.style === "boardingPass" && (
          <FormRow label="Transit type">
            <Segmented label="Transit type" value={p.transitType} onChange={(v) => update((d) => void (d.transitType = v))} options={TRANSIT.map((t) => ({ ...t }))} />
          </FormRow>
        )}
      </Section>
      <Section title="Compatibility" hint="Controls which newer Wallet features are used without a fallback.">
        <div id="compatibility" tabIndex={-1}>
          <Segmented
            label="Compatibility"
            className="w-full"
            value={p.compatibility.target}
            onChange={(target) => update((d) => void (d.compatibility.target = target))}
            options={[
              { value: "broad", label: "Broad", title: "iOS 15 and later" },
              { value: "latest", label: "Latest iOS", title: "iOS 27 and later" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
        {p.compatibility.target === "custom" && (
          <FormRow label="Minimum iOS" htmlFor="minIOS">
            <Input id="minIOS" type="number" min={15} max={27} value={p.compatibility.minIOS} onChange={(e) => update((d) => void (d.compatibility.minIOS = Math.min(27, Math.max(15, Number(e.target.value) || 15))))} className="h-8 w-24" />
          </FormRow>
        )}
        {p.style === "posterGeneric" && (
          <p className="rounded-lg bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Poster passes need iOS 27. Older iPhones show a Generic fallback with the same fields. Preview it with <strong>Legacy Wallet</strong> in the preview toolbar.
          </p>
        )}
      </Section>
      <Section title="Editor">
        <div className="flex items-start justify-between gap-4">
          <div>
            <label htmlFor="accuracy" className="text-sm font-medium">Wallet accuracy</label>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {accuracy ? "Preview shows exactly what Wallet will show. Field limits are enforced." : "Design sandbox: fields Wallet would hide are drawn with a red outline. The generated pass still follows Apple's rules."}
            </p>
          </div>
          <Switch id="accuracy" checked={accuracy} onCheckedChange={(v) => useBuilder.getState().setAccuracy(v)} />
        </div>
      </Section>
    </>
  );
}
