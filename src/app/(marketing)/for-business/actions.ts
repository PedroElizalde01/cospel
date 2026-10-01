"use server";

import { z } from "zod";

const LeadSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email").max(200),
  want: z.string().trim().max(120).optional().default(""),
  users: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().max(4000).optional().default(""),
  // Honeypot: real users never fill this.
  website: z.string().max(0).optional(),
});

export type LeadState = { ok: boolean; error?: string; fieldErrors?: Record<string, string> } | null;

/**
 * Lead sink. Forwards to CONTACT_WEBHOOK_URL (Slack/Zapier/CRM) when set;
 * otherwise logs in development so the form is testable without services.
 */
export async function submitLead(_: LeadState, form: FormData): Promise<LeadState> {
  const parsed = LeadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, fieldErrors };
  }
  const lead = { ...parsed.data, website: undefined };
  const url = process.env.CONTACT_WEBHOOK_URL;
  try {
    if (url) {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "lead", ...lead, at: new Date().toISOString() }) });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    } else if (process.env.NODE_ENV !== "production") {
      console.info("[lead]", lead.company, lead.want);
    } else {
      return { ok: false, error: "Contact isn't configured yet. Please email us instead." };
    }
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}
