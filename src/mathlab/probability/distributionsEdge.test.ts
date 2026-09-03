// Edge-case and property tests for the seed distributions: degenerate bounds,
// large-parameter regimes, and cdf/pmf invariants (spec §71: 0 ≤ F(x) ≤ 1,
// monotone cdf, pmf within support).

import { describe, it, expect } from "vitest";
import { makeDistribution } from "./distribution.ts";
import { makeRng } from "../core/rng.ts";

describe("bernoulli edge cases", () => {
  it("p=0 always returns 0 with variance 0", () => {
    const d = makeDistribution("bernoulli", { p: 0 });
    expect(d.mean).toBe(0);
    expect(d.variance).toBe(0);
    expect(d.pmf!(0)).toBe(1);
    expect(d.pmf!(1)).toBe(0);
    expect(d.sample(makeRng(1))).toBe(0);
  });

  it("p=1 always returns 1", () => {
    const d = makeDistribution("bernoulli", { p: 1 });
    expect(d.mean).toBe(1);
    expect(d.sample(makeRng(1))).toBe(1);
  });

  it("p=0.5 maximizes variance at 0.25", () => {
    expect(makeDistribution("bernoulli", { p: 0.5 }).variance).toBe(0.25);
  });
});

describe("binomial edge cases", () => {
  it("n=0 is always 0", () => {
    const d = makeDistribution("binomial", { n: 0, p: 0.5 });
    expect(d.mean).toBe(0);
    expect(d.sample(makeRng(1))).toBe(0);
    expect(d.pmf!(0)).toBeCloseTo(1, 12);
  });

  it("p=0 ⇒ X=0, p=1 ⇒ X=n", () => {
    expect(makeDistribution("binomial", { n: 5, p: 0 }).sample(makeRng(1))).toBe(0);
    expect(makeDistribution("binomial", { n: 5, p: 1 }).sample(makeRng(1))).toBe(5);
  });

  it("pmf(k) is 0 outside [0, n]", () => {
    const d = makeDistribution("binomial", { n: 10, p: 0.4 });
    expect(d.pmf!(-1)).toBe(0);
    expect(d.pmf!(11)).toBe(0);
    expect(d.pmf!(2.5)).toBe(0);
  });
});

describe("uniform edge cases", () => {
  it("cdf is 0 below a, 1 above b, linear in between", () => {
    const d = makeDistribution("uniform", { a: 2, b: 6 });
    expect(d.cdf(1)).toBe(0);
    expect(d.cdf(6)).toBe(1);
    expect(d.cdf(4)).toBeCloseTo(0.5, 9);
  });

  it("samples stay within [a, b]", () => {
    const d = makeDistribution("uniform", { a: -3, b: 5 });
    const rng = makeRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = d.sample(rng);
      expect(x).toBeGreaterThanOrEqual(-3);
      expect(x).toBeLessThanOrEqual(5);
    }
  });
});

describe("poisson large-λ regime", () => {
  it("large λ still yields non-negative integer samples", () => {
    const d = makeDistribution("poisson", { lambda: 800 });
    const rng = makeRng(7);
    for (let i = 0; i < 200; i++) {
      const x = d.sample(rng);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
    }
  });

  it("pmf decays to 0 far from the mean", () => {
    const d = makeDistribution("poisson", { lambda: 4 });
    expect(d.pmf!(100)).toBeLessThan(1e-10);
  });
});

describe("cdf invariants (0 ≤ F(x) ≤ 1, monotone) — §71", () => {
  const cases: [string, Record<string, number>, [number, number]][] = [
    ["normal", { mu: 0, sigma: 1 }, [-6, 6]],
    ["exponential", { lambda: 2 }, [-1, 8]],
    ["uniform", { a: -2, b: 2 }, [-3, 3]],
    ["bernoulli", { p: 0.4 }, [-1, 2]],
  ];
  for (const [name, params, [lo, hi]] of cases) {
    it(`${name} cdf is monotone and within [0,1]`, () => {
      const d = makeDistribution(name, params);
      let prev = -Infinity;
      for (let x = lo; x <= hi; x += 0.25) {
        const c = d.cdf(x);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
        expect(c).toBeGreaterThanOrEqual(prev - 1e-12);
        prev = c;
      }
    });
  }
});

describe("support is correct", () => {
  it("uniform support is [a, b]; normal is (-∞, ∞); exp is [0, ∞)", () => {
    expect(makeDistribution("uniform", { a: 1, b: 3 }).support).toEqual({ lo: 1, hi: 3 });
    expect(makeDistribution("normal", { mu: 0, sigma: 1 }).support).toEqual({ lo: -Infinity, hi: Infinity });
    expect(makeDistribution("exponential", { lambda: 1 }).support.lo).toBe(0);
    expect(makeDistribution("exponential", { lambda: 1 }).support.hi).toBe(Infinity);
  });
});