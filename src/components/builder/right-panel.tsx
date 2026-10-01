"use client";

import { AlertCircle, AlertTriangle, Check, Copy, Download, EyeOff, Lightbulb, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { passImageFiles, toPassJson } from "@/lib/pass/mapper";
import { DataDetectorSchema, FIELD_GROUPS, type FieldGroup, type PassField, type TextAlignment } from "@/lib/pass/schema";
import { STYLE_SPECS, groupsFor, hiddenFieldIds } from "@/lib/pass/styles";
import type { Issue, Severity } from "@/lib/pass/validate";
import { cn } from "@/lib/utils";
import { findField, useBuilder } from "./store";
import { FormRow, Section, Segmented } from "./ui";

export function goToIssue(issue: Issue) {
  const s = useBuilder.getState();
  s.setPanel(issue.target.panel);
  s.setMobileTab("edit");
  if (issue.target.fieldId) s.select(issue.target.fieldId);
  // Wait for the panel to render, then reveal the control.
  setTimeout(() => {
    const el = document.getElementById(issue.target.control ?? "") ?? (issue.target.fieldId ? document.querySelector(`[data-field-row="${issue.target.fieldId}"]`) : null);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      (el.matches("input,textarea,button,[tabindex]") ? el : el.querySelector<HTMLElement>("input,textarea,button"))?.focus({ preventScroll: true });
    }
  }, 60);
}

const DETECTOR_LABEL = { phone: "Phone numbers", link: "Links", address: "Addresses", calendarEvent: "Dates & events" };

function FieldInspector({ field, group }: { field: PassField; group: FieldGroup }) {
  const style = useBuilder((s) => s.project!.style);
  const { updateField, moveField, removeField } = useBuilder.getState();
  const spec = STYLE_SPECS[style];
  const groups = groupsFor(style);
  const set = (patch: Partial<PassField>, c?: string) => updateField(field.id, patch, c);

  return (
    <div>
      <Section title="Field">
        <FormRow label="Group" htmlFor="insp-group">
          <Select value={group} onValueChange={(g) => moveField(field.id, g as FieldGroup)}>
            <SelectTrigger id="insp-group" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {groups.map((g) => <SelectItem key={g} value={g}>{spec.groups[g]!.label}</SelectItem>)}
              {!groups.includes(group) && <SelectItem value={group}>{group} (not shown)</SelectItem>}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Key" htmlFor="insp-key" hint="Unique identifier in pass.json. Updates and personalization use it.">
          <Input id="insp-key" value={field.key} onChange={(e) => set({ key: e.target.value.replace(/\s/g, "_") }, "key")} className="font-mono text-xs" spellCheck={false} />
        </FormRow>
        <FormRow label="Label" htmlFor="insp-label">
          <Input id="insp-label" value={field.label} onChange={(e) => set({ label: e.target.value }, "label")} />
        </FormRow>
        <FormRow label="Value" htmlFor="insp-value">
          <Textarea id="insp-value" value={field.value} onChange={(e) => set({ value: e.target.value }, "value")} className="min-h-16" />
        </FormRow>
        {group !== "back" && (
          <FormRow label="Alignment">
            <Segmented<TextAlignment>
              label="Text alignment"
              className="w-full"
              value={field.textAlignment}
              onChange={(textAlignment) => set({ textAlignment })}
              options={[
                { value: "natural", label: "Auto" },
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />
          </FormRow>
        )}
        <FormRow label="Change message" htmlFor="insp-change" hint="When this value changes in an update, Wallet shows this notification. Use %@ for the new value.">
          <Input id="insp-change" placeholder="Gate changed to %@" value={field.changeMessage} onChange={(e) => set({ changeMessage: e.target.value }, "change")} />
        </FormRow>
      </Section>
      {group === "back" && (
        <Section title="Make tappable">
          <div className="grid grid-cols-2 gap-1.5">
            {DataDetectorSchema.options.map((d) => {
              const on = field.dataDetectors.includes(d);
              return (
                <label key={d} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set({ dataDetectors: on ? field.dataDetectors.filter((x) => x !== d) : [...field.dataDetectors, d] })}
                    className="accent-foreground"
                  />
                  {DETECTOR_LABEL[d]}
                </label>
              );
            })}
          </div>
        </Section>
      )}
      <Section>
        <Button variant="destructive" size="sm" onClick={() => removeField(field.id)}><Trash2 /> Delete field</Button>
      </Section>
    </div>
  );
}

function Layers() {
  const p = useBuilder((s) => s.project!);
  const select = useBuilder((s) => s.select);
  const hidden = useMemo(() => hiddenFieldIds(p), [p]);
  const spec = STYLE_SPECS[p.style];
  return (
    <div className="px-2 py-3">
      <p className="px-2 pb-2 text-[11px] text-muted-foreground">Pass structure · {spec.name}. Select a field to edit its properties.</p>
      {FIELD_GROUPS.filter((g) => spec.groups[g] || p.fields[g].length).map((g) => (
        <div key={g} className="mb-2">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <span>{spec.groups[g]?.label ?? `${g} (not shown)`}</span>
            {spec.groups[g] && g !== "back" && <span className="tabular-nums">{p.fields[g].length}/{spec.groups[g]!.max}</span>}
          </div>
          {p.fields[g].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => select(f.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="w-20 shrink-0 truncate text-muted-foreground uppercase">{f.label || "—"}</span>
              <span className="min-w-0 flex-1 truncate">{f.value}</span>
              {hidden.has(f.id) && <EyeOff className="size-3 text-amber-600" aria-label="Not shown in Wallet" />}
            </button>
          ))}
          {!p.fields[g].length && <div className="px-2 py-1 text-xs text-muted-foreground/60">Empty</div>}
        </div>
      ))}
    </div>
  );
}

const SEVERITY: Record<Severity, { icon: typeof AlertCircle; className: string; label: string }> = {
  error: { icon: AlertCircle, className: "text-red-600 dark:text-red-400", label: "Errors" },
  warning: { icon: AlertTriangle, className: "text-amber-600 dark:text-amber-400", label: "Warnings" },
  suggestion: { icon: Lightbulb, className: "text-sky-600 dark:text-sky-400", label: "Suggestions" },
};

export function ValidationList({ issues }: { issues: Issue[] }) {
  if (!issues.length)
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Check className="size-4" /></span>
        <p className="text-sm font-medium">Looks good</p>
        <p className="text-xs text-muted-foreground">Nothing to review right now.</p>
      </div>
    );
  return (
    <ul className="space-y-1 p-2">
      {issues.map((i) => {
        const s = SEVERITY[i.severity];
        return (
          <li key={i.id}>
            <button
              type="button"
              onClick={() => goToIssue(i)}
              className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs leading-relaxed hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <s.icon className={cn("mt-0.5 size-3.5 shrink-0", s.className)} aria-label={s.label} />
              <span>{i.message}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Developer() {
  const p = useBuilder((s) => s.project!);
  const json = useMemo(() => JSON.stringify(toPassJson(p), null, 2), [p]);
  const files = useMemo(() => passImageFiles(p), [p]);
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">pass.json <span className="font-normal text-muted-foreground">· read-only, live</span></span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-xs" aria-label="Copy pass.json" onClick={() => navigator.clipboard.writeText(json).then(() => toast.success("Copied pass.json"))}><Copy /></Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Download pass.json"
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
              a.download = "pass.json";
              a.click();
            }}
          >
            <Download />
          </Button>
        </div>
      </div>
      <pre className="max-h-[55vh] overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-[11px] leading-relaxed">{json}</pre>
      <div className="space-y-1.5">
        <div className="text-xs font-medium">Bundle contents</div>
        <ul className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
          <li>pass.json</li>
          {files.map((f) => <li key={f.name}>{f.name}.png, @2x, @3x <span className="opacity-60">({f.width}×{f.height} pt)</span></li>)}
          <li>manifest.json <span className="opacity-60">(SHA-1 of each file)</span></li>
          <li>signature <span className="opacity-60">(PKCS #7, server-side)</span></li>
        </ul>
        <p className="text-[11px] text-muted-foreground">Identifiers are placeholders until a signing identity is configured.</p>
      </div>
    </div>
  );
}

export function RightPanel({ issues }: { issues: Issue[] }) {
  const selected = useBuilder((s) => s.selectedFieldId);
  const project = useBuilder((s) => s.project!);
  const loc = selected ? findField(project, selected) : null;
  const errors = issues.filter((i) => i.severity !== "suggestion").length;

  return (
    <Tabs defaultValue="inspect" className="flex h-full flex-col gap-0">
      <div className="border-b border-border/60 p-2">
        <TabsList className="w-full">
          <TabsTrigger value="inspect">Inspect</TabsTrigger>
          <TabsTrigger value="review">
            Review
            {issues.length > 0 && <span className={cn("ml-1 rounded-full px-1.5 text-[10px] tabular-nums", errors ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-muted-foreground/15")}>{issues.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="developer">JSON</TabsTrigger>
        </TabsList>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabsContent value="inspect">
          {loc ? (
            <>
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="text-xs text-muted-foreground">Selected field</span>
                <Button variant="ghost" size="xs" onClick={() => useBuilder.getState().select(null)}>Show structure</Button>
              </div>
              <FieldInspector key={loc.field.id} field={loc.field} group={loc.group} />
            </>
          ) : (
            <Layers />
          )}
        </TabsContent>
        <TabsContent value="review">
          <div className="px-4 pt-3 text-xs text-muted-foreground">
            {issues.length ? `${issues.length} thing${issues.length === 1 ? "" : "s"} to review` : ""}
          </div>
          <ValidationList issues={issues} />
        </TabsContent>
        <TabsContent value="developer">
          <Developer />
        </TabsContent>
      </div>
    </Tabs>
  );
}
