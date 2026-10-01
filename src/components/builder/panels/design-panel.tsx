"use client";

import { Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { contrastRatio, isDark } from "@/lib/pass/color";
import { IMAGE_SLOTS } from "@/lib/pass/schema";
import { STYLE_SPECS } from "@/lib/pass/styles";
import { useAssetUrl } from "@/lib/storage/drafts";
import { AssetSlot } from "../asset-slot";
import { ColorField, extractPalette } from "../color-field";
import { useBuilder } from "../store";
import { PanelHeader, Section } from "../ui";

const COLORS = [
  { key: "backgroundColor", label: "Background" },
  { key: "foregroundColor", label: "Text" },
  { key: "labelColor", label: "Labels" },
] as const;

export function DesignPanel() {
  const p = useBuilder((s) => s.project!);
  const update = useBuilder((s) => s.update);
  const logoUrl = useAssetUrl(p.images.logo);
  const [palette, setPalette] = useState<string[]>([]);
  const spec = STYLE_SPECS[p.style];

  useEffect(() => {
    if (logoUrl) extractPalette(logoUrl).then(setPalette, () => setPalette([]));
  }, [logoUrl]);

  const autoText = () =>
    update((d) => {
      const dark = isDark(d.branding.backgroundColor);
      d.branding.foregroundColor = dark ? "#ffffff" : "#111111";
      d.branding.labelColor = dark ? "#a1a1aa" : "#6b6b6b";
    });

  const ratio = contrastRatio(p.branding.backgroundColor, p.branding.foregroundColor);

  return (
    <>
      <PanelHeader title="Design" description="Colors and images. Pass colors stay exactly as set, whatever theme the viewer uses." />
      <Section
        title="Colors"
        actions={
          <Button variant="ghost" size="xs" onClick={autoText} title="Pick readable text colors for this background">
            <Wand2 /> Auto text
          </Button>
        }
      >
        <div className="space-y-2">
          {COLORS.map((c) => (
            <ColorField
              key={c.key}
              id={c.key}
              label={c.label}
              value={p.branding[c.key]}
              palette={logoUrl ? palette : []}
              onChange={(hex, commit) => update((d) => void (d.branding[c.key] = hex), commit ? undefined : `color-${c.key}`)}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Text contrast {ratio.toFixed(1)}:1 {ratio >= 4.5 ? "· good" : ratio >= 3 ? "· fair" : "· too low"}
        </p>
      </Section>
      <Section title="Images" hint="Images stay in your browser. When you generate a real pass, they're resized to @1x, @2x and @3x PNGs on the server.">
        <div className="space-y-2">
          {IMAGE_SLOTS.filter((s) => spec.images.includes(s)).map((slot) => (
            <AssetSlot
              key={slot}
              slot={slot}
              disabledReason={p.style === "eventTicket" && p.images.strip && (slot === "background" || slot === "thumbnail") ? "Not used while a strip image is set" : undefined}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
