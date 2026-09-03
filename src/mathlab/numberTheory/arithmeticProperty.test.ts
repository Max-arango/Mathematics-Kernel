// Property-focused tests for the exact bigint number-theory foundation:
// Bézout identities, modular-arithmetic invariants (spec §71), and boundary
// handling (non-integers rejected, sign conventions).

import { describe, it, expect } from "vitest";
import { gcd, lcm, mod, modPow, modInverse, extendedEuclid, toBig } from "./arithmetic.ts";
import { DomainError, InvalidInputError } from "../core/errors.ts";

describe("gcd / lcm (property tests)", () => {
  it("gcd is associative and commutative on a triple", () => {
    const a = 48n, b = 36n, c = 60n;
    expect(gcd(gcd(a, b), c)).toBe(gcd(a, gcd(b, c)));
    expect(gcd(a, b)).toBe(gcd(b, a));
  });

  it("gcd(a, 0) = |a|, gcd(0, 0) = 0", () => {
    expect(gcd(12, 0)).toBe(12n);
    expect(gcd(-12, 0)).toBe(12n);
    expect(gcd(0, 0)).toBe(0n);
  });

  it("gcd is always non-negative even for negative inputs", () => {
    expect(gcd(-48, 18)).toBe(6n);
    expect(gcd(48, -18)).toBe(6n);
  });

  it("lcm(a, b)·gcd(a, b) = a·b (for positive a, b)", () => {
    const a = 24n, b = 36n;
    expect(lcm(a, b) * gcd(a, b)).toBe(a * b);
  });

  it("lcm(a, 0) = 0 and lcm is non-negative", () => {
    expect(lcm(5, 0)).toBe(0n);
    expect(lcm(0, 5)).toBe(0n);
    expect(lcm(-6, 8)).toBe(24n);
  });

  it("lcm of a prime pair is their product", () => {
    expect(lcm(17, 19)).toBe(17n * 19n);
  });
});

describe("mod (non-negative convention)", () => {
  it("mod(-7, 3) = 2 (not -1 like native %)", () => {
    expect(mod(-7, 3)).toBe(2n);
  });

  it("mod handles negative modulus by using absolute value", () => {
    expect(mod(7, -3)).toBe(1n);
  });

  it("mod returns a residue in [0, m)", () => {
    expect(mod(100, 7)).toBe(2n);
    expect(mod(0, 7)).toBe(0n);
  });

  it("mod with zero modulus throws", () => {
    expect(() => mod(5, 0)).toThrow(InvalidInputError);
  });
});

describe("modPow (square-and-multiply)", () => {
  it("modPow(7, 256, 13) === 7^256 mod 13 (large exponent stays exact)", () => {
    // 7^256 overflows a float64, but bigint modPow is exact.
    expect(modPow(7, 256, 13)).toBe(modPow(7n, 256n, 13n));
  });

  it("modPow(2, 10, 1000) = 24", () => {
    expect(modPow(2, 10, 1000)).toBe(24n);
  });

  it("modPow with negative base reduces to canonical residue", () => {
    expect(modPow(-1, 3, 7)).toBe(6n); // (-1)^3 = -1 ≡ 6 (mod 7)
  });

  it("modPow(x, 0, m) = 1 (for m > 1)", () => {
    expect(modPow(5, 0, 7)).toBe(1n);
  });

  it("modPow handles m = 1 (everything ≡ 0)", () => {
    expect(modPow(5, 100, 1)).toBe(0n);
  });

  it("modPow rejects negative exponent and non-positive modulus", () => {
    expect(() => modPow(2, -1, 7)).toThrow(InvalidInputError);
    expect(() => modPow(2, 3, 0)).toThrow(InvalidInputError);
  });
});

describe("extendedEuclid (Bézout identity)", () => {
  it("a·x + b·y = g = gcd(a, b)", () => {
    const a = 240n, b = 46n;
    const { g, x, y } = extendedEuclid(a, b);
    expect(g).toBe(gcd(a, b));
    expect(a * x + b * y).toBe(g);
  });

  it("g ≥ 0 always", () => {
    expect(extendedEuclid(-240, 46).g).toBeGreaterThanOrEqual(0n);
  });

  it("extendedEuclid(0, b) returns { g, 0, sign }", () => {
    const { g, x, y } = extendedEuclid(0, 5);
    expect(g).toBe(5n);
    expect(0n * x + 5n * y).toBe(g);
  });
});

describe("modInverse", () => {
  it("a · a⁻¹ ≡ 1 (mod m) when coprime", () => {
    const inv = modInverse(3, 7);
    expect(mod(3n * inv, 7n)).toBe(1n);
    expect(inv).toBe(5n); // 3·5 = 15 ≡ 1 (mod 7)
  });

  it("throws DomainError when not coprime", () => {
    expect(() => modInverse(2, 4)).toThrow(DomainError);
  });

  it("throws InvalidInputError for non-positive modulus", () => {
    expect(() => modInverse(3, 0)).toThrow(InvalidInputError);
  });

  it("inverse of 1 mod any m > 1 is 1", () => {
    expect(modInverse(1, 5)).toBe(1n);
  });
});

describe("toBig boundary policy", () => {
  it("accepts bigint and integer number", () => {
    expect(toBig(5)).toBe(5n);
    expect(toBig(5n)).toBe(5n);
  });

  it("rejects non-integer floats, NaN, and Infinity", () => {
    expect(() => toBig(1.5)).toThrow(InvalidInputError);
    expect(() => toBig(NaN)).toThrow(InvalidInputError);
    expect(() => toBig(Infinity)).toThrow(InvalidInputError);
  });

  it("accepts negative integers", () => {
    expect(toBig(-7)).toBe(-7n);
  });
});