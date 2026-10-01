"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldList } from "../field-list";
import { useBuilder } from "../store";
import { PanelHeader, Section } from "../ui";

const PRESETS = [
  { key: "about", label: "About", value: "Tell customers what this pass is for." },
  { key: "terms", label: "Terms & Conditions", value: "" },
  { key: "website", label: "Website", value: "https://" },
  { key: "support", label: "Customer support", value: "help@example.com" },
  { key: "phone", label: "Phone", value: "+1 555 0100" },
  { key: "privacy", label: "Privacy policy", value: "https://" },
  { key: "rules", label: "Membership rules", value: "" },
  { key: "legal", label: "Legal", value: "" },
];

export function DetailsPanel() {
  const back = useBuilder((s) => s.project!.fields.back);
  const keys = new Set(back.map((f) => f.key));
  return (
    <>
      <PanelHeader title="Pass details" description="Shown when someone opens the pass details in Wallet. Links, phone numbers and addresses become tappable." />
      <Section title="Quick add">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.filter((p) => !keys.has(p.key)).map((p) => (
            <Button key={p.key} variant="outline" size="xs" onClick={() => useBuilder.getState().addField("back", { key: p.key, label: p.label, value: p.value })}>
              <Plus /> {p.label}
            </Button>
          ))}
        </div>
      </Section>
      <Section>
        <FieldList group="back" title="Details" />
      </Section>
    </>
  );
}
