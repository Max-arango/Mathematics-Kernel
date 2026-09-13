// Quantity arithmetic: value in SI base units + physical dimension; enforce
// dimensional consistency on add/sub, combine dimensions on mul/div/pow.

import { describe, it, expect } from "vitest";
import { dim } from "./dimension.ts";
import { quantity, addQ, subQ, mulQ, divQ, powQ, scaleQ } from "./quantity.ts";
import { DimensionError } from "../core/errors.ts";

const L = dim({ length: 1 });
const T = dim({ time: 1 });
const VEL = dim({ length: 1, time: -1 });

describe("addQ / subQ", () => {
  it("adds matching-dimension quantities (values add, dim preserved)", () => {
    const r = addQ(quantity(3, L), quantity(4, L));
    expect(r.value).toBe(7);
    expect(r.dim).toEqual(L);
  });

  it("subtracts matching-dimension quantities", () => {
    const r = subQ(quantity(3, L), quantity(4, L));
    expect(r.value).toBe(-1);
    expect(r.dim).toEqual(L);
  });

  it("throws DimensionError on add with mismatched dimensions", () => {
    expect(() => addQ(quantity(5, L), quantity(2, T))).toThrow(DimensionError);
  });

  it("throws DimensionError on sub with mismatched dimensions", () => {
    expect(() => subQ(quantity(5, L), quantity(2, T))).toThrow(DimensionError);
  });

  it("error message names the mismatched dimensions", () => {
    try {
      addQ(quantity(5, L), quantity(2, T));
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as DimensionError).message).toMatch(/dimension mismatch/);
    }
  });
});

describe("mulQ / divQ / powQ", () => {
  it("mulQ multiplies values and adds dimensions", () => {
    const area = mulQ(quantity(3, L), quantity(4, L));
    expect(area.value).toBe(12);
    expect(area.dim).toEqual(dim({ length: 2 }));
  });

  it("divQ divides values and subtracts dimensions", () => {
    const v = divQ(quantity(10, L), quantity(5, T));
    expect(v.value).toBe(2);
    expect(v.dim).toEqual(VEL);
  });

  it("powQ powers the value and scales the dimension", () => {
    const sq = powQ(quantity(3, L), 2);
    expect(sq.value).toBe(9);
    expect(sq.dim).toEqual(dim({ length: 2 }));
  });

  it("powQ with fractional exponent gives fractional dimension (√area → length)", () => {
    const area = quantity(16, dim({ length: 2 }));
    const side = powQ(area, 0.5);
    expect(side.value).toBe(4);
    expect(side.dim).toEqual(L);
  });

  it("scaleQ scales only the value, leaves dimension", () => {
    const r = scaleQ(quantity(5, VEL), 2);
    expect(r.value).toBe(10);
    expect(r.dim).toEqual(VEL);
  });
});

describe("quantity is a plain record", () => {
  it("quantity() round-trips value + dim", () => {
    const q = quantity(2.5, VEL);
    expect(q.value).toBe(2.5);
    expect(q.dim).toEqual(VEL);
  });
});