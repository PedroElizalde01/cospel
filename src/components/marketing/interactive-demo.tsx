"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/builder/ui";
import { WalletPassPreview, type WalletPlatform } from "@/components/pass/wallet-pass-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDark } from "@/lib/pass/color";
import { starterProject } from "@/lib/pass/factory";
import { cn } from "@/lib/utils";

const COLORS = ["#f4ede4", "#0d0d0f", "#0f2a4a", "#1d3b2a", "#e5372b", "#fbeff0"];
const KINDS = { loyalty: "Loyalty", membership: "Membership", event: "Event" } as const;

/** A tiny live editor on the homepage: same preview component as the real builder. */
export function InteractiveDemo() {
  const [kind, setKind] = useState<keyof typeof KINDS>("loyalty");
  const [business, setBusiness] = useState("North Coffee");
  const [member, setMember] = useState("Maya Chen");
  const [bg, setBg] = useState(COLORS[0]);
  const [platform, setPlatform] = useState<WalletPlatform>("apple");

  const starters = useMemo(() => ({ loyalty: starterProject("loyalty"), membership: starterProject("membership"), event: starterProject("event") }), []);
  const project = useMemo(() => {
    const p = structuredClone(starters[kind]);
    const dark = isDark(bg);
    p.branding = { ...p.branding, organizationName: business, logoText: business, backgroundColor: bg, foregroundColor: dark ? "#ffffff" : "#1c1410", labelColor: dark ? "#a1a1aa" : "#7a6a5e" };
    const nameField = [...p.fields.primary, ...p.fields.secondary].find((f) => ["member", "name"].includes(f.key));
    if (nameField) nameField.value = member;
    return p;
  }, [starters, kind, business, member, bg]);

  return (
    <div className="grid items-center gap-10 rounded-3xl border border-border/70 bg-card p-6 sm:p-10 md:grid-cols-[1fr_auto]">
      <div className="max-w-sm space-y-5">
        <div className="flex flex-wrap gap-2">
          <Segmented label="Platform" value={platform} onChange={setPlatform} options={[{ value: "apple", label: "Apple Wallet" }, { value: "google", label: "Google Wallet" }]} />
          <Segmented label="Pass type" value={kind} onChange={setKind} options={Object.entries(KINDS).map(([value, label]) => ({ value: value as keyof typeof KINDS, label }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-business">Business name</Label>
          <Input id="demo-business" value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={28} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-member">Member name</Label>
          <Input id="demo-member" value={member} onChange={(e) => setMember(e.target.value)} maxLength={28} />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Background</span>
          <div className="flex gap-2" role="radiogroup" aria-label="Background color">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={bg === c}
                aria-label={c}
                onClick={() => setBg(c)}
                className={cn("size-8 rounded-full border border-black/10 transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-white/15", bg === c && "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background")}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">One design, both wallets. This is the same preview the editor uses.</p>
      </div>
      <div className="flex justify-center">
        <WalletPassPreview project={project} platform={platform} scale={platform === "google" ? 0.75 : 0.9} />
      </div>
    </div>
  );
}
