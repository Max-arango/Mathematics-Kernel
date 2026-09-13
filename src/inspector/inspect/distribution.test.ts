// Tests for the probability-distribution inspector. Pin structure, every
// registered distribution, the seeded preview reproducibility, and graceful
// degradation on unknown names / invalid parameters.

import { describe, expect, it } from "vitest";
import { inspect } from "../engine.ts";
import { inspectDistribution } from "./distribution.ts";

describe("inspectDistribution", () => {
  it("reports Parameters, Moments, and Shape & sampling sections", () => {
    const r = inspectDistribution("normal", { mu: 0, sigma: 1 });
    const titles = r.sections.map((s) => s.title);
    expect(titles).toContain("Parameters");
    expect(titles).toContain("Moments (closed form)");
    expect(titles).toContain("Shape & sampling");
  });

  it("normal(0,1) closed-form moments are exact", () => {
    const r = inspectDistribution("normal", { mu: 0, sigma: 1 });
    const m = r.sections.find((s) => s.title === "Moments (closed form)")!;
    expect(m.properties.find((p) => p.label === "Mean E[X]")!.value).toBe("0");
    expect(m.properties.find((p) => p.label === "Variance Var(X)")!.value).toBe("1");
    expect(m.properties.find((p) => p.label === "Std. dev. σ")!.value).toBe("1");
    expect(m.properties.find((p) => p.label === "Skewness")!.value).toBe("0.0000");
    expect(m.properties.find((p) => p.label === "Excess kurtosis")!.value).toBe("0.0000");
  });

  it("binomial(n, p) closed-form moments are exact", () => {
    const r = inspectDistribution("binomial", { n: 10, p: 0.3 });
    const m = r.sections.find((s) => s.title === "Moments (closed form)")!;
    expect(m.properties.find((p) => p.label === "Mean E[X]")!.value).toBe("3");
    expect(m.properties.find((p) => p.label === "Variance Var(X)")!.value).toBe("2.1");
  });

  it("poisson(λ) mean == variance == λ", () => {
    const r = inspectDistribution("poisson", { lambda: 4 });
    const m = r.sections.find((s) => s.title === "Moments (closed form)")!;
    expect(m.properties.find((p) => p.label === "Mean E[X]")!.value).toBe("4");
    expect(m.properties.find((p) => p.label === "Variance Var(X)")!.value).toBe("4");
  });

  it("uniform(a, b) support is the closed interval", () => {
    const r = inspectDistribution("uniform", { a: -1, b: 5 });
    const params = r.sections.find((s) => s.title === "Parameters")!;
    expect(params.properties.find((p) => p.label === "Support")!.value).toContain("-1");
    expect(params.properties.find((p) => p.label === "Support")!.value).toContain("5");
  });

  it("normal support is the whole real line", () => {
    const r = inspectDistribution("normal", { mu: 0, sigma: 1 });
    const params = r.sections.find((s) => s.title === "Parameters")!;
    expect(params.properties.find((p) => p.label === "Support")!.value).toContain("−∞");
    expect(params.properties.find((p) => p.label === "Support")!.value).toContain("+∞");
  });

  it("exponential skewness is exactly 2 (heavy tail)", () => {
    const r = inspectDistribution("exponential", { lambda: 1 });
    const m = r.sections.find((s) => s.title === "Moments (closed form)")!;
    expect(m.properties.find((p) => p.label === "Skewness")!.value).toBe("2.0000");
    expect(m.properties.find((p) => p.label === "Excess kurtosis")!.value).toBe("6.0000");
  });

  it("seeded sample preview is reproducible (same seed ⇒ same values)", () => {
    const a = inspectDistribution("normal", { mu: 0, sigma: 1 }, 42);
    const b = inspectDistribution("normal", { mu: 0, sigma: 1 }, 42);
    const sa = a.sections.find((s) => s.title === "Shape & sampling")!.properties.find((p) => p.label === "Sample mean")!.value;
    const sb = b.sections.find((s) => s.title === "Shape & sampling")!.properties.find((p) => p.label === "Sample mean")!.value;
    expect(sa).toBe(sb);
  });

  it("different seeds produce different sample means (almost surely)", () => {
    const a = inspectDistribution("normal", { mu: 0, sigma: 1 }, 1);
    const b = inspectDistribution("normal", { mu: 0, sigma: 1 }, 999);
    const ma = a.sections.find((s) => s.title === "Shape & sampling")!.properties.find((p) => p.label === "Sample mean")!.value;
    const mb = b.sections.find((s) => s.title === "Shape & sampling")!.properties.find((p) => p.label === "Sample mean")!.value;
    expect(ma).not.toBe(mb);
  });

  it("discrete distributions declare PMF, continuous declare PDF", () => {
    const bin = inspectDistribution("binomial", { n: 5, p: 0.5 });
    const nor = inspectDistribution("normal", { mu: 0, sigma: 1 });
    expect(bin.sections.find((s) => s.title === "Shape & sampling")!.properties.some((p) => p.label === "PMF")).toBe(true);
    expect(nor.sections.find((s) => s.title === "Shape & sampling")!.properties.some((p) => p.label === "PDF")).toBe(true);
  });

  it("capabilities include graph and compare", () => {
    const r = inspectDistribution("normal", { mu: 0, sigma: 1 });
    expect(r.capabilities).toContain("graph");
    expect(r.capabilities).toContain("compare");
  });

  it("identity includes the family name", () => {
    const r = inspectDistribution("bernoulli", { p: 0.5 });
    expect(r.identity).toContain("bernoulli");
  });

  it("degrades gracefully on an unknown distribution name", () => {
    const r = inspectDistribution("not-a-dist", {});
    expect(r.identity).toBe("Invalid distribution");
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("degrades gracefully on out-of-range parameters", () => {
    const r = inspectDistribution("bernoulli", { p: 1.5 });
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("registers through the engine's MathObject dispatch", () => {
    const r = inspect({ kind: "distribution", name: "exponential", params: { lambda: 1 }, seed: 7 });
    expect(r.kind).toBe("distribution");
    expect(r.sections.length).toBeGreaterThan(0);
  });

  it("Binomial with huge n is not penalized at the inspector level", () => {
    // The Binomial sampler is O(n) per draw, so a 1e9 n would be expensive; the
    // inspector warns and skips the preview rather than hanging.
    const r = inspectDistribution("binomial", { n: 1e10, p: 0.5 }, 1);
    const sp = r.sections.find((s) => s.title === "Shape & sampling")!;
    expect(sp.properties.find((p) => p.label === "Preview samples (seeded)")!.value).toBe("0");
    expect(r.warnings.some((w) => w.includes("preview cap"))).toBe(true);
  });
});
