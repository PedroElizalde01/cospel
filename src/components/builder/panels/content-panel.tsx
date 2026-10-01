"use client";

import { Input } from "@/components/ui/input";
import { FIELD_GROUPS } from "@/lib/pass/schema";
import { STYLE_SPECS, combinedRowMax } from "@/lib/pass/styles";
import { FieldList } from "../field-list";
import { useBuilder } from "../store";
import { FormRow, PanelHeader, Section } from "../ui";

export function ContentPanel() {
  const p = useBuilder((s) => s.project!);
  const update = useBuilder((s) => s.update);
  const spec = STYLE_SPECS[p.style];
  const combined = combinedRowMax(p);
  const frontGroups = FIELD_GROUPS.filter((g) => g !== "back" && spec.groups[g]);
  const orphanGroups = FIELD_GROUPS.filter((g) => !spec.groups[g] && p.fields[g].length);

  return (
    <>
      <PanelHeader title="Content" description={<>Wallet places fields for you. You control what they say and their order. <span className="whitespace-nowrap">Uses {spec.name}.</span></>} />
      <Section title="Pass info">
        <FormRow label="Organization name" htmlFor="organizationName" hint="Shown in notifications and on the lock screen.">
          <Input id="organizationName" value={p.branding.organizationName} onChange={(e) => update((d) => void (d.branding.organizationName = e.target.value), "org")} placeholder="North Coffee" />
        </FormRow>
        {p.style !== "posterGeneric" && (
          <FormRow label="Logo text" htmlFor="logoText" hint="Appears next to the logo. Leave empty if your logo includes the name.">
            <Input id="logoText" value={p.branding.logoText} onChange={(e) => update((d) => void (d.branding.logoText = e.target.value), "logoText")} placeholder="North Coffee" />
          </FormRow>
        )}
        <FormRow label="Description" htmlFor="description" hint="Required by Apple. VoiceOver reads it, e.g. “North Coffee loyalty card”.">
          <Input id="description" value={p.branding.description} onChange={(e) => update((d) => void (d.branding.description = e.target.value), "desc")} placeholder="Loyalty card" />
        </FormRow>
      </Section>
      <Section
        title="Front fields"
        hint={combined !== undefined ? `This layout shares one row between secondary and auxiliary fields: ${combined} total.` : undefined}
      >
        <div className="space-y-5">
          {frontGroups.map((g) => (
            <FieldList key={g} group={g} title={spec.groups[g]!.label} hint={spec.groups[g]!.hint} max={spec.groups[g]!.max} />
          ))}
        </div>
      </Section>
      {orphanGroups.length > 0 && (
        <Section title="Not shown in this style" hint="These fields belong to groups this pass style doesn't display. Move them or switch style back.">
          <div className="space-y-5">
            {orphanGroups.map((g) => (
              <FieldList key={g} group={g} title={g[0].toUpperCase() + g.slice(1)} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
