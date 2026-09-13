// Tests for the time-series inspector.

import { describe, expect, it } from "vitest";
import { inspect } from "../engine.ts";
import { inspectTimeSeries } from "./timeSeries.ts";

describe("inspectTimeSeries", () => {
  it("Length & range reports samples, t-range, y-range", () => {
    const r = inspectTimeSeries([0, 1, 2, 3], [1, 4, 9, 16]);
    const sec = r.sections.find((s) => s.title === "Length & range")!;
    expect(sec.properties.find((p) => p.label === "Samples")!.value).toBe("4");
    expect(sec.properties.find((p) => p.label === "t range")!.value).toContain("[0, 3]");
    expect(sec.properties.find((p) => p.label === "y range")!.value).toContain("[1, 16]");
  });

  it("uniform Δt is flagged uniform; monotone increasing by default", () => {
    const r = inspectTimeSeries([0, 0.1, 0.2, 0.3], [1, 2, 3, 4]);
    const steps = r.sections.find((s) => s.title === "Steps")!;
    expect(steps.properties.find((p) => p.label === "Δt monotone (increasing)")!.value).toBe("yes");
    expect(steps.properties.find((p) => p.label === "Δt uniform")!.value).toMatch(/uniform/);
  });

  it("non-monotone t is flagged", () => {
    const r = inspectTimeSeries([0, 1, 0.5, 2], [1, 2, 3, 4]);
    const steps = r.sections.find((s) => s.title === "Steps")!;
    expect(steps.properties.find((p) => p.label === "Δt monotone (increasing)")!.value).toBe("no");
  });

  it("non-uniform Δt reports the spread", () => {
    const r = inspectTimeSeries([0, 0.1, 0.5, 1.5], [1, 2, 3, 4]);
    const steps = r.sections.find((s) => s.title === "Steps")!;
    expect(steps.properties.find((p) => p.label === "Δt uniform")!.value).toMatch(/spread/);
  });

  it("y descriptive matches statistics/summary", () => {
    const r = inspectTimeSeries([0, 1, 2, 3, 4], [2, 4, 6, 8, 10]);
    const sec = r.sections.find((s) => s.title === "y descriptive")!;
    expect(sec.properties.find((p) => p.label === "Mean")!.value).toBe("6");
    expect(sec.properties.find((p) => p.label === "Median")!.value).toBe("6");
  });

  it("Linear trend: positive slope for y = 2t + 1", () => {
    const t = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = t.map((x) => 2 * x + 1);
    const r = inspectTimeSeries(t, y);
    const trend = r.sections.find((s) => s.title.startsWith("Linear trend"))!;
    const slope = Number(trend.properties.find((p) => p.label === "Slope b")!.value);
    const intercept = Number(trend.properties.find((p) => p.label === "Intercept a")!.value);
    expect(Math.abs(slope - 2)).toBeLessThan(1e-9);
    expect(Math.abs(intercept - 1)).toBeLessThan(1e-9);
  });

  it("Linear trend: zero slope for constant y", () => {
    const r = inspectTimeSeries([0, 1, 2, 3], [5, 5, 5, 5]);
    const trend = r.sections.find((s) => s.title.startsWith("Linear trend"))!;
    const slope = Number(trend.properties.find((p) => p.label === "Slope b")!.value);
    expect(slope).toBe(0);
  });

  it("identity includes sample count and t range", () => {
    const r = inspectTimeSeries([0, 1, 2], [10, 20, 30]);
    expect(r.identity).toContain("3 samples");
    expect(r.identity).toContain("[0, 2]");
  });

  it("capabilities include graph and trajectory", () => {
    const r = inspectTimeSeries([0, 1, 2], [1, 2, 3]);
    expect(r.capabilities).toContain("graph");
    expect(r.capabilities).toContain("trajectory");
  });

  it("degrades gracefully on empty series", () => {
    const r = inspectTimeSeries([], []);
    expect(r.identity).toBe("Empty time series");
    expect(r.warnings).toHaveLength(0);
    expect(r.sections).toHaveLength(0);
  });

  it("degrades gracefully on length mismatch", () => {
    const r = inspectTimeSeries([0, 1, 2], [1, 2]);
    expect(r.warnings.some((w) => w.includes("length"))).toBe(true);
  });

  it("degrades gracefully on non-finite values", () => {
    const r = inspectTimeSeries([0, 1, 2], [1, Infinity, 3]);
    expect(r.warnings.some((w) => w.includes("non-finite"))).toBe(true);
  });

  it("degrades gracefully when t is not an array", () => {
    const r = inspectTimeSeries("oops" as unknown as number[], [1, 2]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("registers through the engine's MathObject dispatch", () => {
    const r = inspect({ kind: "timeSeries", t: [0, 1, 2], y: [1, 2, 3] });
    expect(r.kind).toBe("timeSeries");
    expect(r.sections.length).toBeGreaterThan(0);
  });
});
