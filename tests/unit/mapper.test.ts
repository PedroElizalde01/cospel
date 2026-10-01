import { describe, expect, it } from "vitest";
import { createProject, starterProject } from "@/lib/pass/factory";
import { toPassJson, passImageFiles } from "@/lib/pass/mapper";
import { PURPOSES } from "@/lib/pass/styles";

describe("toPassJson", () => {
  it("maps branding, identity and colors", () => {
    const p = starterProject("loyalty");
    const json = toPassJson(p, { passTypeIdentifier: "pass.com.acme.a", teamIdentifier: "ABCDE12345", serialNumber: "s1" });
    expect(json).toMatchObject({
      formatVersion: 1,
      passTypeIdentifier: "pass.com.acme.a",
      teamIdentifier: "ABCDE12345",
      serialNumber: "s1",
      organizationName: "Your Business",
      backgroundColor: "rgb(244, 237, 228)",
    });
    expect(json.storeCard).toBeDefined();
    expect(json.generic).toBeUndefined();
  });

  it("never emits more fields than Wallet allows", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ key: `k${i}`, label: "L", value: "V" }));
    const p = createProject({ style: "storeCard", fields: { primary: many, secondary: many.map((f) => ({ ...f, key: `s${f.key}` })), auxiliary: many.map((f) => ({ ...f, key: `a${f.key}` })) } });
    const dict = toPassJson(p).storeCard as Record<string, unknown[]>;
    expect(dict.primaryFields).toHaveLength(1);
    expect(dict.secondaryFields.length + (dict.auxiliaryFields?.length ?? 0)).toBe(4);
  });

  it("applies the combined row limit to generic passes only with square barcodes", () => {
    const five = Array.from({ length: 3 }, (_, i) => ({ key: `x${i}`, value: "v" }));
    const fields = { secondary: five, auxiliary: five.map((f) => ({ ...f, key: `y${f.key}` })) };
    const qr = toPassJson(createProject({ style: "generic", fields, barcode: { format: "qr", message: "1" } })).generic as Record<string, unknown[]>;
    const pdf = toPassJson(createProject({ style: "generic", fields, barcode: { format: "pdf417", message: "1" } })).generic as Record<string, unknown[]>;
    expect(qr.secondaryFields.length + qr.auxiliaryFields.length).toBe(4);
    expect(pdf.secondaryFields.length + pdf.auxiliaryFields.length).toBe(6);
  });

  it("maps field attributes and back-field data detectors", () => {
    const p = createProject({
      style: "generic",
      fields: {
        header: [{ key: "gate", label: "Gate", value: "A", textAlignment: "right", changeMessage: "Gate %@" }],
        back: [{ key: "web", label: "Web", value: "https://x.example", dataDetectors: ["link"] }],
      },
    });
    const g = toPassJson(p).generic as Record<string, Record<string, unknown>[]>;
    expect(g.headerFields[0]).toEqual({ key: "gate", label: "Gate", value: "A", textAlignment: "PKTextAlignmentRight", changeMessage: "Gate %@" });
    expect(g.backFields[0].dataDetectorTypes).toEqual(["PKDataDetectorTypeLink"]);
    expect(g.headerFields[0].dataDetectorTypes).toBeUndefined();
  });

  it("adds a fallback barcode only when the format is too new for the target", () => {
    const base = { style: "storeCard" as const, barcode: { format: "ean13" as const, message: "4006381333931", fallbackFormat: "qr" as const } };
    const broad = toPassJson(createProject({ ...base, compatibility: { target: "broad", minIOS: 17 } }));
    const latest = toPassJson(createProject({ ...base, compatibility: { target: "latest", minIOS: 27 } }));
    expect((broad.barcodes as { format: string }[]).map((b) => b.format)).toEqual(["PKBarcodeFormatEAN13", "PKBarcodeFormatQR"]);
    expect((latest.barcodes as unknown[]).length).toBe(1);
  });

  it("omits barcodes when disabled", () => {
    expect(toPassJson(createProject({ style: "generic", barcode: { enabled: false, message: "x" } })).barcodes).toBeUndefined();
  });

  it("emits posterGeneric with a generic fallback using the same keys", () => {
    const json = toPassJson(starterProject("poster"));
    const poster = json.posterGeneric as Record<string, { key: string }[]>;
    const generic = json.generic as Record<string, { key: string }[]>;
    expect(poster.footerFields.map((f) => f.key)).toEqual(["plan"]);
    expect(generic.primaryFields.map((f) => f.key)).toEqual(["title"]);
    expect(generic.secondaryFields.map((f) => f.key)).toEqual(["name"]);
    expect(generic.auxiliaryFields.map((f) => f.key)).toEqual(["plan"]);
    expect(json.logoText).toBeUndefined();
  });

  it("sets transitType on boarding passes", () => {
    expect((toPassJson(starterProject("boarding")).boardingPass as Record<string, unknown>).transitType).toBe("PKTransitTypeAir");
  });

  it("maps relevance and caps locations at 10", () => {
    const p = createProject({
      style: "generic",
      relevance: {
        relevantDate: "2026-07-18T18:00:00.000Z",
        expirationDate: "2026-07-19T06:00:00.000Z",
        maxDistance: 100,
        locations: Array.from({ length: 12 }, (_, i) => ({ id: `${i}`, name: "", latitude: 1, longitude: 2, relevantText: i ? "" : "Near store" })),
      },
    });
    const json = toPassJson(p);
    expect(json.relevantDate).toBe("2026-07-18T18:00:00.000Z");
    expect(json.relevantDates).toEqual([{ date: "2026-07-18T18:00:00.000Z" }]);
    expect(json.locations).toHaveLength(10);
    expect((json.locations as Record<string, unknown>[])[0]).toEqual({ latitude: 1, longitude: 2, relevantText: "Near store" });
    expect(json.maxDistance).toBe(100);
  });

  it("lists image files, dropping event ticket background when a strip is set", () => {
    const ref = { kind: "url" as const, url: "/x.svg" };
    const p = createProject({ style: "eventTicket", images: { logo: ref, strip: ref, background: ref, thumbnail: ref } });
    expect(passImageFiles(p).map((f) => f.name).sort()).toEqual(["logo", "strip"]);
    const poster = createProject({ style: "posterGeneric", images: { logo: ref, artwork: ref } });
    expect(passImageFiles(poster).map((f) => f.name).sort()).toEqual(["artwork", "logo", "primaryLogo"]);
  });

  it("produces a style dictionary for every purpose", () => {
    for (const purpose of PURPOSES) {
      const json = toPassJson(starterProject(purpose.id));
      expect(Object.keys(json)).toContain(purpose.style);
    }
  });
});
