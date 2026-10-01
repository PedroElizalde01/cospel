import { describe, expect, it } from "vitest";
import { createProject, starterProject } from "@/lib/pass/factory";
import { validateProject } from "@/lib/pass/validate";
import { TEMPLATES } from "@/lib/templates";

const ids = (p: Parameters<typeof validateProject>[0], ctx?: Parameters<typeof validateProject>[1]) => validateProject(p, ctx).map((i) => i.id);

describe("validateProject", () => {
  it("system templates have no errors", () => {
    for (const t of TEMPLATES) {
      const errors = validateProject(t.build()).filter((i) => i.severity === "error");
      expect(errors, t.slug).toEqual([]);
    }
  });

  it("requires organization name and description", () => {
    const p = createProject({ style: "generic" });
    expect(ids(p)).toEqual(expect.arrayContaining(["org", "description"]));
  });

  it("flags invalid colors and low contrast", () => {
    const p = starterProject("membership");
    p.branding.labelColor = "red";
    p.branding.foregroundColor = "#121214";
    const r = ids(p);
    expect(r).toContain("color-labelColor");
    expect(r).toContain("contrast-fg");
  });

  it("warns when a group exceeds Wallet's limit", () => {
    const p = starterProject("loyalty");
    p.fields.primary.push({ ...p.fields.primary[0], id: "x", key: "extra" });
    expect(ids(p)).toContain("max-primary");
  });

  it("warns about the combined secondary/auxiliary row with the store card message", () => {
    const p = createProject({
      style: "storeCard",
      branding: { organizationName: "A", description: "B" },
      fields: { secondary: [{ key: "a" }, { key: "b" }, { key: "c" }], auxiliary: [{ key: "d" }, { key: "e" }] },
    });
    const issue = validateProject(p).find((i) => i.id === "combined-row");
    expect(issue?.message).toMatch(/limited front-facing field space/);
  });

  it("warns about fields in groups the style doesn't show", () => {
    const p = starterProject("loyalty");
    p.fields.footer.push({ ...p.fields.primary[0], id: "f", key: "foot" });
    expect(ids(p)).toContain("group-footer");
  });

  it("catches duplicate and empty keys", () => {
    const p = createProject({ style: "generic", fields: { primary: [{ key: "a" }], secondary: [{ key: "a" }, { key: "" }] } });
    const r = ids(p);
    expect(r.filter((x) => x.startsWith("key-dup"))).toHaveLength(2);
    expect(r.some((x) => x.startsWith("key-empty"))).toBe(true);
  });

  it("validates barcode messages per format", () => {
    const p = starterProject("coupon");
    p.barcode.message = "";
    expect(ids(p)).toContain("barcode-empty");
    p.barcode = { ...p.barcode, format: "ean13", message: "12AB" };
    expect(ids(p)).toContain("barcode-format");
    p.barcode = { ...p.barcode, format: "code128", message: "naïve" };
    expect(ids(p)).toContain("barcode-format");
  });

  it("requires a fallback for barcode formats newer than the target", () => {
    const p = starterProject("loyalty");
    p.barcode = { ...p.barcode, format: "itf", message: "1234" };
    expect(ids(p)).toContain("barcode-compat");
    p.barcode.fallbackFormat = "qr";
    expect(ids(p)).not.toContain("barcode-compat");
  });

  it("rejects invalid coordinates", () => {
    const p = starterProject("loyalty");
    p.relevance.locations.push({ id: "l1", name: "", latitude: 95, longitude: 0, relevantText: "" });
    expect(ids(p)).toContain("loc-l1");
  });

  it("makes a missing icon an error only when generating", () => {
    const p = starterProject("loyalty");
    expect(validateProject(p).find((i) => i.id === "icon")?.severity).toBe("warning");
    expect(validateProject(p, { mode: "generate" }).find((i) => i.id === "icon")?.severity).toBe("error");
  });

  it("reports signing availability and certificate expiry", () => {
    const p = starterProject("loyalty");
    const now = new Date("2026-10-01T00:00:00Z");
    expect(validateProject(p, { mode: "generate", signing: { configured: false } }).find((i) => i.id === "signing")?.severity).toBe("error");
    expect(ids(p, { signing: { configured: true, expiresAt: "2026-09-01T00:00:00Z" }, now })).toContain("cert-expired");
    expect(ids(p, { signing: { configured: true, expiresAt: "2026-10-15T00:00:00Z" }, now })).toContain("cert-expiring");
  });

  it("sorts errors before warnings before suggestions", () => {
    const sev = validateProject(createProject({ style: "generic" })).map((i) => i.severity);
    const rank = { error: 0, warning: 1, suggestion: 2 };
    expect(sev).toEqual([...sev].sort((a, b) => rank[a] - rank[b]));
  });
});
