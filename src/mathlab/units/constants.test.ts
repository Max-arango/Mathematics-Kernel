// Scientific constants registry: structure, dimensions, lookups, and the
// exact-by-definition vs measured-source distinction.

import { describe, it, expect } from "vitest";
import { CONSTANTS, constant, constantQuantity } from "./constants.ts";
import { isDimensionless, dim } from "./dimension.ts";
import { InvalidInputError } from "../core/errors.ts";

describe("mathematical constants", () => {
  it("pi, e, phi, tau are dimensionless", () => {
    for (const k of ["pi", "e", "phi", "tau"] as const) {
      expect(isDimensionless(CONSTANTS[k].dim)).toBe(true);
      expect(CONSTANTS[k].category).toBe("mathematical");
    }
  });

  it("phi is the golden ratio", () => {
    expect(CONSTANTS.phi.value).toBeCloseTo((1 + Math.sqrt(5)) / 2, 12);
  });

  it("tau === 2π", () => {
    expect(CONSTANTS.tau.value).toBeCloseTo(2 * Math.PI, 12);
  });
});

describe("physical constants", () => {
  it("speed of light c has velocity dimension L·T⁻¹", () => {
    expect(CONSTANTS.c.dim).toEqual(dim({ length: 1, time: -1 }));
    expect(CONSTANTS.c.value).toBe(299792458); // exact by SI 2019
  });

  it("Planck constant h is exact by SI 2019", () => {
    expect(CONSTANTS.h.source).toMatch(/exact/i);
    expect(CONSTANTS.h.value).toBeCloseTo(6.62607015e-34, 20);
  });

  it("Boltzmann & elementary charge & Avogadro are exact by SI 2019", () => {
    for (const k of ["kB", "e_charge", "NA"] as const) {
      expect(CONSTANTS[k].source).toMatch(/exact/i);
    }
  });

  it("gravitational constant G is measured (CODATA), not exact", () => {
    expect(CONSTANTS.G.source).toMatch(/CODATA/i);
    expect(CONSTANTS.G.dim).toEqual(dim({ length: 3, mass: -1, time: -2 }));
  });

  it("electron/proton mass are measured (CODATA) with mass dimension", () => {
    expect(CONSTANTS.me.dim).toEqual(dim({ mass: 1 }));
    expect(CONSTANTS.mp.dim).toEqual(dim({ mass: 1 }));
    expect(CONSTANTS.me.source).toMatch(/CODATA/i);
  });

  it("R ≈ N_A · k_B (physical cross-check)", () => {
    expect(CONSTANTS.R.value).toBeCloseTo(CONSTANTS.NA.value * CONSTANTS.kB.value, 4);
  });

  it("standard gravity g0 has acceleration dimension L·T⁻²", () => {
    expect(CONSTANTS.g0.dim).toEqual(dim({ length: 1, time: -2 }));
    expect(CONSTANTS.g0.value).toBeCloseTo(9.80665, 9);
  });

  it("every physical constant has a non-empty unit string", () => {
    for (const [key, k] of Object.entries(CONSTANTS)) {
      if (k.category === "physical") {
        expect(k.unit.length, `${key} should have a unit`).toBeGreaterThan(0);
      }
    }
  });

  it("every constant has a name, symbol, and source", () => {
    for (const k of Object.values(CONSTANTS)) {
      expect(k.name.length).toBeGreaterThan(0);
      expect(k.symbol.length).toBeGreaterThan(0);
      expect(k.source.length).toBeGreaterThan(0);
    }
  });
});

describe("lookup", () => {
  it("constant(key) returns the constant", () => {
    expect(constant("pi").value).toBe(Math.PI);
  });

  it("constant(key) throws on unknown key", () => {
    expect(() => constant("not-a-constant")).toThrow(InvalidInputError);
  });

  it("constantQuantity returns a dimensional Quantity in SI units", () => {
    const q = constantQuantity("c");
    expect(q.value).toBe(299792458);
    expect(q.dim).toEqual(dim({ length: 1, time: -1 }));
  });
});