"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VARIABLE_PRESETS, extractVariables } from "@/lib/pass/variables";
import { findField, useBuilder } from "../store";
import { PanelHeader, Section } from "../ui";

/** Adds `{{name}}` to the selected field, or copies it when nothing is selected. */
function insertVariable(name: string, sample: string) {
  const s = useBuilder.getState();
  const token = `{{${name}}}`;
  s.update((d) => {
    if (!(name in d.sampleData)) d.sampleData[name] = sample;
  });
  const loc = s.selectedFieldId && s.project ? findField(s.project, s.selectedFieldId) : null;
  if (loc) {
    s.updateField(loc.field.id, { value: loc.field.value ? `${loc.field.value} ${token}` : token });
    toast.success(`Added ${token} to “${loc.field.label || loc.field.key}”`);
  } else {
    navigator.clipboard?.writeText(token);
    toast(`Copied ${token}`, { description: "Select a field first to insert it directly." });
  }
}

export function DataPanel() {
  const project = useBuilder((s) => s.project!);
  const update = useBuilder((s) => s.update);
  const used = useMemo(() => extractVariables(project), [project]);
  const unused = Object.keys(project.sampleData).filter((k) => !used.has(k));

  return (
    <>
      <PanelHeader
        title="Data"
        description={<>Write <code className="rounded bg-muted px-1">{"{{customer.points}}"}</code> in any text. Each customer&apos;s pass fills it with their own data. The preview uses the sample values below.</>}
      />
      <Section title="Variables in this pass">
        {used.size === 0 ? (
          <p className="text-xs text-muted-foreground">No variables yet. Type one in a field, or insert one below.</p>
        ) : (
          <ul className="space-y-2">
            {[...used].map(([name, count]) => (
              <li key={name} className="space-y-1">
                <label htmlFor={`var-${name}`} className="flex items-center justify-between font-mono text-[11px]">
                  <span>{`{{${name}}}`}</span>
                  <span className="font-sans text-muted-foreground">{count} use{count === 1 ? "" : "s"}</span>
                </label>
                <Input
                  id={`var-${name}`}
                  placeholder="Sample value"
                  value={project.sampleData[name] ?? ""}
                  onChange={(e) => update((d) => void (d.sampleData[name] = e.target.value), `var-${name}`)}
                  className="h-8"
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Insert" hint="Inserts into the selected field. Select a field in the preview or the Content panel first.">
        <div className="flex flex-wrap gap-1.5">
          {VARIABLE_PRESETS.map((v) => (
            <Button key={v.key} variant="outline" size="xs" className="font-mono" onClick={() => insertVariable(v.key, v.sample)}>
              <Plus /> {v.key}
            </Button>
          ))}
        </div>
      </Section>
      {unused.length > 0 && (
        <Section title="Unused sample values">
          <ul className="space-y-1">
            {unused.map((k) => (
              <li key={k} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-mono">{k} = {project.sampleData[k]}</span>
                <Button variant="ghost" size="icon-xs" aria-label={`Remove ${k}`} onClick={() => update((d) => void delete d.sampleData[k])}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
