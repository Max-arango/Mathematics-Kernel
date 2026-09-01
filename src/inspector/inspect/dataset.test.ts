// Tests for the dataset inspector. Pin the schema/summary/correlations sections
// and graceful degradation on bad input.

import { describe, expect, it } from "vitest";
import { inspect } from "../engine.ts";
import { inspectDataset } from "./dataset.ts";

describe("inspectDataset", () => {
  it("samples source: single column 'x'", () => {
    const r = inspectDataset("samples", [1, 2, 3, 4, 5]);
    expect(r.identity).toContain("5 × 1");
    expect(r.sections.find((s) => s.title === "Schema")!.properties.find((p) => p.label === "Columns")!.value).toBe("x");
  });

  it("xy source: two columns 'x' and 'y'", () => {
    const r = inspectDataset("xy", [[0, 0], [1, 1], [2, 4], [3, 9]]);
    expect(r.sections.find((s) => s.title === "Schema")!.properties.find((p) => p.label === "Columns")!.value).toBe("x, y");
  });

  it("matrix source: columns auto-named c0..c{K-1}", () => {
    const r = inspectDataset("matrix", [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    expect(r.sections.find((s) => s.title === "Schema")!.properties.find((p) => p.label === "Columns")!.value).toBe("c0, c1, c2");
  });

  it("per-column summary appears once per column", () => {
    const r = inspectDataset("xy", [[0, 1], [1, 2], [2, 3]]);
    const s = r.sections.find((sec) => sec.title === "Per-column summary")!;
    expect(s.properties).toHaveLength(2);
    expect(s.properties[0].label).toBe("x");
    expect(s.properties[1].label).toBe("y");
  });

  it("per-column mean of a known sequence is exact", () => {
    const r = inspectDataset("samples", [2, 4, 6, 8]);
    const s = r.sections.find((sec) => sec.title === "Per-column summary")!;
    expect(s.properties[0].value).toContain("mean=5");
    expect(s.properties[0].value).toContain("median=5");
  });

  it("correlations section reports Pearson r between numeric columns", () => {
    // y = 2x ⇒ r = 1; an extra column 'z' = -x ⇒ r(x,z) = -1.
    const data = [[0, 0, 0], [1, 2, -1], [2, 4, -2], [3, 6, -3]];
    const r = inspectDataset("matrix", data);
    const c = r.sections.find((sec) => sec.title === "Correlations")!;
    expect(c.properties.length).toBe(3); // (c0,c1), (c0,c2), (c1,c2)
    const r01 = Number(c.properties.find((p) => p.label === "corr(c0, c1)")!.value);
    const r02 = Number(c.properties.find((p) => p.label === "corr(c0, c2)")!.value);
    expect(Math.abs(r01 - 1)).toBeLessThan(1e-9);
    expect(Math.abs(r02 + 1)).toBeLessThan(1e-9);
  });

  it("zero-variance column ⇒ correlation skipped with a warning", () => {
    const r = inspectDataset("xy", [[0, 1], [1, 1], [2, 1], [3, 1]]);
    expect(r.warnings.some((w) => w.includes("correlation"))).toBe(true);
  });

  it("single-column dataset ⇒ no Correlations section", () => {
    const r = inspectDataset("samples", [1, 2, 3]);
    expect(r.sections.some((s) => s.title === "Correlations")).toBe(false);
  });

  it("single-row dataset still inspects, but no correlations", () => {
    const r = inspectDataset("xy", [[1, 2]]);
    expect(r.sections.find((s) => s.title === "Schema")!.properties.find((p) => p.label === "Rows (n)")!.value).toBe("1");
    expect(r.sections.some((s) => s.title === "Correlations")).toBe(false);
  });

  it("name appears in identity when provided", () => {
    const r = inspectDataset("samples", [1, 2, 3], "trial-1");
    expect(r.identity).toContain('"trial-1"');
  });

  it("degrades gracefully on empty samples", () => {
    const r = inspectDataset("samples", []);
    expect(r.identity).toBe("Invalid dataset");
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("degrades gracefully on mismatched xy width", () => {
    const r = inspectDataset("xy", [[0, 1, 2]]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("degrades gracefully on ragged matrix", () => {
    const r = inspectDataset("matrix", [[1, 2], [3, 4, 5]]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("degrades gracefully when xy receives a flat array", () => {
    const r = inspectDataset("xy", [1, 2, 3]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("registers through the engine's MathObject dispatch", () => {
    const r = inspect({ kind: "dataset", source: "samples", data: [1, 2, 3] });
    expect(r.kind).toBe("dataset");
    expect(r.sections.length).toBeGreaterThan(0);
  });

  it("capabilities include graph and compare", () => {
    const r = inspectDataset("samples", [1, 2, 3]);
    expect(r.capabilities).toContain("graph");
    expect(r.capabilities).toContain("compare");
  });
});
