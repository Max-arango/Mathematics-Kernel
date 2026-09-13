// Monte Carlo property tests: reproducibility from seed, standard error shrinks
// as 1/√N, π estimation converges, and the estimator is honest about being a
// statistical estimate (not exact).

import { describe, it, expect } from "vitest";
import { monteCarlo, estimatePi, estimateIntegral } from "./monteCarlo.ts";
import { InvalidInputError, ResourceLimitError } from "../core/errors.ts";

describe("monteCarlo core", () => {
  it("estimate of a constant is exact regardless of samples", () => {
    const r = monteCarlo(() => 7, { samples: 1000, seed: 1 });
    expect(r.estimate).toBe(7);
    expect(r.standardError).toBe(0); // no variance
  });

  it("same seed ⇒ identical estimate; different seed ⇒ differs", () => {
    const a = monteCarlo((rng) => rng.next(), { samples: 5000, seed: 42 });
    const b = monteCarlo((rng) => rng.next(), { samples: 5000, seed: 42 });
    const c = monteCarlo((rng) => rng.next(), { samples: 5000, seed: 43 });
    expect(a).toEqual(b);
    expect(a.estimate).not.toBe(c.estimate);
  });

  it("rejects non-positive / non-integer sample counts", () => {
    expect(() => monteCarlo(() => 1, { samples: 0, seed: 1 })).toThrow(InvalidInputError);
    expect(() => monteCarlo(() => 1, { samples: 2.5, seed: 1 })).toThrow(InvalidInputError);
    expect(() => monteCarlo(() => 1, { samples: -10, seed: 1 })).toThrow(InvalidInputError);
  });

  it("rejects samples above the resource cap", () => {
    expect(() => monteCarlo(() => 1, { samples: 1e12, seed: 1 })).toThrow(ResourceLimitError);
  });

  it("standard error shrinks as sample count grows", () => {
    const r1 = monteCarlo((rng) => rng.next(), { samples: 1000, seed: 1 });
    const r2 = monteCarlo((rng) => rng.next(), { samples: 4000, seed: 1 });
    // 4× the samples → ~2× smaller SE (statistically expected)
    expect(r2.standardError).toBeLessThan(r1.standardError);
  });

  it("ci95 interval brackets the estimate", () => {
    const r = monteCarlo((rng) => rng.next(), { samples: 10000, seed: 3 });
    expect(r.ci95[0]).toBeLessThan(r.estimate);
    expect(r.ci95[1]).toBeGreaterThan(r.estimate);
    expect(r.ci95[1] - r.ci95[0]).toBeCloseTo(2 * 1.96 * r.standardError, 9);
  });
});

describe("estimatePi", () => {
  it("converges toward π with enough samples (within a few standard errors)", () => {
    const r = estimatePi(400000, 123);
    expect(Math.abs(r.estimate - Math.PI)).toBeLessThan(0.05); // SE ≈ 3·sqrt(π·(4−π)/N) ≈ 0.017
  });

  it("is reproducible from its seed", () => {
    expect(estimatePi(10000, 5)).toEqual(estimatePi(10000, 5));
  });

  it("advertises sample count and seed in the result", () => {
    const r = estimatePi(1000, 99);
    expect(r.samples).toBe(1000);
    expect(r.seed).toBe(99);
  });
});

describe("estimateIntegral", () => {
  it("∫₀¹ x² dx ≈ 1/3 (up to sampling error)", () => {
    const r = estimateIntegral((x) => x * x, 0, 1, 200000, 7);
    expect(Math.abs(r.estimate - 1 / 3)).toBeLessThan(0.02);
  });

  it("rejects a ≥ b", () => {
    expect(() => estimateIntegral((x) => x, 1, 1, 100, 1)).toThrow(InvalidInputError);
    expect(() => estimateIntegral((x) => x, 2, 0, 100, 1)).toThrow(InvalidInputError);
  });

  it("integral of a constant matches the exact area", () => {
    const r = estimateIntegral(() => 3, 1, 4, 5000, 1);
    expect(r.estimate).toBeCloseTo(9, 1); // 3·(4−1)
  });
});