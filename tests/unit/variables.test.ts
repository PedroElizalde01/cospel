import { describe, expect, it } from "vitest";
import { createProject } from "@/lib/pass/factory";
import { toPassJson } from "@/lib/pass/mapper";
import { validateProject } from "@/lib/pass/validate";
import { extractVariables, interpolate, resolveProject } from "@/lib/pass/variables";
import { getTemplate } from "@/lib/templates";

const project = () =>
  createProject({
    style: "storeCard",
    branding: { organizationName: "North", description: "Card for {{customer.name}}" },
    fields: { primary: [{ key: "points", label: "Points", value: "{{customer.points}}" }], secondary: [{ key: "n", value: "{{ customer.name }}" }] },
    barcode: { message: "MBR-{{customer.member_id}}" },
    sampleData: { "customer.points": "120", "customer.name": "Ada" },
  });

describe("variables", () => {
  it("interpolates known names and keeps unknown ones visible", () => {
    expect(interpolate("{{a}} and {{ b.c }} and {{missing}}", { a: "1", "b.c": "2" })).toBe("1 and 2 and {{missing}}");
  });

  it("extracts variables with counts in first-seen order", () => {
    expect([...extractVariables(project())]).toEqual([["customer.name", 2], ["customer.member_id", 1], ["customer.points", 1]]);
  });

  it("resolves every text without changing structure or ids", () => {
    const p = project();
    const r = resolveProject(p);
    expect(r.fields.primary[0]).toMatchObject({ id: p.fields.primary[0].id, value: "120" });
    expect(r.branding.description).toBe("Card for Ada");
    expect(r.barcode.message).toBe("MBR-{{customer.member_id}}");
  });

  it("maps pass.json with sample data by default and customer data when given", () => {
    const p = project();
    const sample = toPassJson(p).storeCard as { primaryFields: { value: string }[] };
    expect(sample.primaryFields[0].value).toBe("120");
    const real = toPassJson(p, undefined, { "customer.points": "50", "customer.name": "Bo", "customer.member_id": "7" });
    expect((real.storeCard as { primaryFields: { value: string }[] }).primaryFields[0].value).toBe("50");
    expect((real.barcodes as { message: string }[])[0].message).toBe("MBR-7");
  });

  it("suggests sample values in the editor and blocks generation without data", () => {
    const p = project();
    expect(validateProject(p).find((i) => i.id === "var-customer.member_id")?.severity).toBe("suggestion");
    expect(validateProject(p, { mode: "generate" }).find((i) => i.id === "var-customer.member_id")?.severity).toBe("error");
    expect(validateProject(p, { mode: "generate", data: { "customer.points": "1", "customer.name": "A", "customer.member_id": "2" } }).some((i) => i.id.startsWith("var-"))).toBe(false);
  });

  it("templates with variables ship sample data for all of them", () => {
    for (const slug of ["coffee-loyalty", "restaurant-rewards", "gym-membership", "event-ticket"]) {
      const p = getTemplate(slug)!.build();
      expect(extractVariables(p).size, slug).toBeGreaterThan(0);
      expect(validateProject(p).filter((i) => i.id.startsWith("var-")), slug).toEqual([]);
    }
  });
});
