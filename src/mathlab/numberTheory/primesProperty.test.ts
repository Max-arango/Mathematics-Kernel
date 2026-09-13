// Property/reference tests for the multiplicative-number-theory functions:
// primality (deterministic Miller–Rabin), factorization round-trips, φ/μ/divisors.
// These deliberately test invariants (∏ p^e = n, φ properties) rather than only
// hard-coded outputs (spec §71).

import { describe, it, expect } from "vitest";
import { isPrime, factorize, divisors, eulerPhi, mobius, primesUpTo, collatz } from "./primes.ts";
import { InvalidInputError, ResourceLimitError } from "../core/errors.ts";

describe("isPrime (deterministic Miller–Rabin)", () => {
  it("identifies small primes and composites", () => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    for (const p of primes) expect(isPrime(p), `${p} should be prime`).toBe(true);
    for (const c of [0, 1, 4, 6, 8, 9, 15, 21, 25, 49, 91]) expect(isPrime(c), `${c} should be composite`).toBe(false);
  });

  it("correctly handles large primes (no false positives below the proven bound)", () => {
    expect(isPrime(104729)).toBe(true); // 10000th prime
    expect(isPrime(2147483647)).toBe(true); // Mersenne prime 2^31 − 1
    expect(isPrime(32416190071)).toBe(true); // > 2^32
    expect(isPrime(32416190071 + 2)).toBe(false); // nearby composite
  });

  it("is strong-pseudoprime-safe (Carmichael number 561 is composite)", () => {
    expect(isPrime(561)).toBe(false);
    expect(isPrime(1105)).toBe(false);
    expect(isPrime(1729)).toBe(false);
  });

  it("1 and 0 are not prime", () => {
    expect(isPrime(1)).toBe(false);
    expect(isPrime(0)).toBe(false);
  });
});

describe("factorize (∏ p^e = n round-trip)", () => {
  it("factorizes composites and reconstructs n exactly", () => {
    for (const n of [12, 84, 360, 1000, 1001, 65536, 123456789n]) {
      const f = factorize(n);
      let product = 1n;
      for (const { prime, exponent } of f) product *= prime ** BigInt(exponent);
      expect(product, `factorize(${n}) must round-trip`).toBe(typeof n === "bigint" ? n : BigInt(n));
    }
  });

  it("factorize returns ascending prime/exponent pairs", () => {
    const f = factorize(84); // 2^2 · 3 · 7
    expect(f).toEqual([
      { prime: 2n, exponent: 2 },
      { prime: 3n, exponent: 1 },
      { prime: 7n, exponent: 1 },
    ]);
  });

  it("factorize(1) = [] (empty product)", () => {
    expect(factorize(1)).toEqual([]);
  });

  it("factorize of a prime returns exactly one factor with exponent 1", () => {
    expect(factorize(97)).toEqual([{ prime: 97n, exponent: 1 }]);
  });

  it("rejects n < 1", () => {
    expect(() => factorize(0)).toThrow(InvalidInputError);
    expect(() => factorize(-5)).toThrow(InvalidInputError);
  });

  it("splits a hard-ish semiprime (two mid-size primes) exactly", () => {
    const n = 999983n * 999979n;
    const f = factorize(n);
    const primes = f.map(({ prime, exponent }) => ({ prime, exponent }));
    expect(primes).toEqual([
      { prime: 999979n, exponent: 1 },
      { prime: 999983n, exponent: 1 },
    ]);
  });
});

describe("divisors", () => {
  it("lists all divisors sorted, count = ∏(eᵢ+1)", () => {
    expect(divisors(12)).toEqual([1n, 2n, 3n, 4n, 6n, 12n]);
    expect(divisors(12).length).toBe(6); // (2+1)(1+1)
  });

  it("divisors of a prime are [1, p]", () => {
    expect(divisors(7)).toEqual([1n, 7n]);
  });

  it("divisors(1) = [1]", () => {
    expect(divisors(1)).toEqual([1n]);
  });

  it("rejects n < 1", () => {
    expect(() => divisors(0)).toThrow(InvalidInputError);
  });
});

describe("eulerPhi / mobius", () => {
  it("φ(p) = p−1 for prime p", () => {
    expect(eulerPhi(7)).toBe(6n);
    expect(eulerPhi(13)).toBe(12n);
  });

  it("φ is multiplicative for coprime args: φ(ab) = φ(a)φ(b)", () => {
    const a = 8n, b = 9n; // coprime
    expect(eulerPhi(a * b)).toBe(eulerPhi(a) * eulerPhi(b));
  });

  it("φ(1) = 1", () => {
    expect(eulerPhi(1)).toBe(1n);
  });

  it("φ(p^k) = p^k − p^(k−1)", () => {
    expect(eulerPhi(8n)).toBe(4n); // 2^3 → 8 − 4 = 4
    expect(eulerPhi(9n)).toBe(6n); // 3^2 → 9 − 3 = 6
  });

  it("μ is 0 for squareful, ±1 for squarefree", () => {
    expect(mobius(1)).toBe(1);
    expect(mobius(2)).toBe(-1); // one prime
    expect(mobius(6)).toBe(1); // two primes
    expect(mobius(30)).toBe(-1); // three primes
    expect(mobius(4)).toBe(0); // 2² squareful
    expect(mobius(12)).toBe(0); // 2²·3 squareful
    expect(mobius(9)).toBe(0); // 3² squareful
  });

  it("rejects n < 1 for φ and μ", () => {
    expect(() => eulerPhi(0)).toThrow(InvalidInputError);
    expect(() => mobius(0)).toThrow(InvalidInputError);
  });
});

describe("primesUpTo (sieve)", () => {
  it("π(100) = 25 primes", () => {
    expect(primesUpTo(100)).toHaveLength(25);
  });

  it("π(1000) = 168 primes", () => {
    expect(primesUpTo(1000)).toHaveLength(168);
  });

  it("empty for limit < 2", () => {
    expect(primesUpTo(0)).toEqual([]);
    expect(primesUpTo(1)).toEqual([]);
  });

  it("rejects non-integer and negative limit", () => {
    expect(() => primesUpTo(1.5)).toThrow(InvalidInputError);
    expect(() => primesUpTo(-1)).toThrow(InvalidInputError);
  });

  it("rejects limit above the cap with ResourceLimitError", () => {
    expect(() => primesUpTo(20_000_000)).toThrow(ResourceLimitError);
  });
});

describe("collatz", () => {
  it("collatz(1) has a 1-step-empty sequence terminating at 1", () => {
    const { sequence, steps } = collatz(1);
    expect(sequence).toEqual([1n]);
    expect(steps).toBe(0);
  });

  it("collatz(6) → 6,3,10,5,16,8,4,2,1", () => {
    const { sequence, steps } = collatz(6);
    expect(sequence).toEqual([6n, 3n, 10n, 5n, 16n, 8n, 4n, 2n, 1n]);
    expect(steps).toBe(8);
  });

  it("collatz(27) terminates (the famous long case)", () => {
    const { steps } = collatz(27);
    expect(steps).toBeGreaterThan(0);
  });

  it("sequence always ends in 1 and length = steps + 1", () => {
    for (const n of [1, 2, 3, 10, 25, 100]) {
      const { sequence, steps } = collatz(n);
      expect(sequence[sequence.length - 1]).toBe(1n);
      expect(sequence.length).toBe(steps + 1);
    }
  });

  it("rejects n < 1", () => {
    expect(() => collatz(0)).toThrow(InvalidInputError);
    expect(() => collatz(-3)).toThrow(InvalidInputError);
  });
});