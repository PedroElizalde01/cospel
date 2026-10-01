"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/(marketing)/for-business/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = [
  { name: "company", label: "Company", required: true, autoComplete: "organization" },
  { name: "name", label: "Name", required: true, autoComplete: "name" },
  { name: "email", label: "Email", required: true, type: "email", autoComplete: "email" },
  { name: "want", label: "What do you want to create?", placeholder: "Loyalty card, membership, tickets…" },
  { name: "users", label: "Approximate number of users", placeholder: "e.g. 500" },
] as const;

export function ContactForm() {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, null);
  if (state?.ok)
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border/70 p-10 text-center" role="status">
        <CheckCircle2 className="size-8 text-emerald-600" />
        <h3 className="text-lg font-medium">Thanks, we&apos;ll be in touch.</h3>
        <p className="text-sm text-muted-foreground">Usually within one business day.</p>
      </div>
    );
  return (
    <form action={action} className="grid gap-4 rounded-3xl border border-border/70 p-6 sm:grid-cols-2 sm:p-8" noValidate>
      {FIELDS.map((f) => (
        <div key={f.name} className={f.name === "want" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
          <Label htmlFor={`lead-${f.name}`}>{f.label}{"required" in f && <span aria-hidden className="text-muted-foreground"> *</span>}</Label>
          <Input
            id={`lead-${f.name}`}
            name={f.name}
            type={"type" in f ? f.type : "text"}
            required={"required" in f}
            autoComplete={"autoComplete" in f ? f.autoComplete : undefined}
            placeholder={"placeholder" in f ? f.placeholder : undefined}
            aria-invalid={!!state?.fieldErrors?.[f.name]}
            aria-describedby={state?.fieldErrors?.[f.name] ? `lead-${f.name}-err` : undefined}
          />
          {state?.fieldErrors?.[f.name] && <p id={`lead-${f.name}-err`} className="text-xs text-destructive">{state.fieldErrors[f.name]}</p>}
        </div>
      ))}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="lead-message">Message</Label>
        <Textarea id="lead-message" name="message" rows={4} />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state?.error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} size="lg">{pending ? "Sending…" : "Send"}</Button>
      </div>
    </form>
  );
}
