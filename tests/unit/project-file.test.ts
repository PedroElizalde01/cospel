import { describe, expect, it } from "vitest";
import { starterProject } from "@/lib/pass/factory";
import { buildProjectFile, parseProjectFile } from "@/lib/pass/project-file";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

describe("project files", () => {
  it("round-trips a project with embedded assets", () => {
    const p = starterProject("event");
    p.images.logo = { kind: "local", id: "a1", width: 300, height: 100 };
    const text = JSON.stringify(buildProjectFile(p, { a1: { mime: "image/png", width: 300, height: 100, dataUrl: PNG } }));
    const out = parseProjectFile(text);
    expect(out.project).toEqual(p);
    expect(out.assets.a1.dataUrl).toBe(PNG);
  });

  it("rejects malformed files with readable errors", () => {
    expect(() => parseProjectFile("nope")).toThrow(/valid JSON/);
    expect(() => parseProjectFile("{}")).toThrow(/walletpassproject/);
    const p = starterProject("event");
    p.images.logo = { kind: "local", id: "missing", width: 1, height: 1 };
    expect(() => parseProjectFile(JSON.stringify(buildProjectFile(p, {})))).toThrow(/image/);
  });

  it("refuses files from a newer schema", () => {
    const file = { ...buildProjectFile(starterProject("event"), {}), schemaVersion: 99 };
    expect(() => parseProjectFile(JSON.stringify(file))).toThrow(/newer version/);
  });

  it("rejects non-image data URLs", () => {
    const file = buildProjectFile(starterProject("event"), {});
    const bad = { ...file, assets: { x: { mime: "image/png", width: 1, height: 1, dataUrl: "data:text/html;base64,PGgxPg==" } } };
    expect(() => parseProjectFile(JSON.stringify(bad))).toThrow();
  });
});
