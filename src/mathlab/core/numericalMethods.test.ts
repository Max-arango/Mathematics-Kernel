// Tests for the unified numerical-method registry.

import { describe, expect, it } from "vitest";
import {
  NUMERICAL_METHODS,
  numericalMethod,
  methodsByFamily,
  registeredFamilies,
  type MethodFamily,
} from "./numericalMethods.ts";

describe("NUMERICAL_METHODS", () => {
  it("contains the expected families", () => {
    const families = new Set<MethodFamily>(registeredFamilies());
    for (const f of ["RootSolver", "Integrator", "ODESolver", "Optimizer", "LinearSolver", "MonteCarloMethod"] as MethodFamily[]) {
      expect(families.has(f)).toBe(true);
    }
  });

  it("every entry has the required fields", () => {
    for (const m of Object.values(NUMERICAL_METHODS)) {
      expect(m.name).toBeTruthy();
      expect(m.family).toBeTruthy();
      expect(m.description.length).toBeGreaterThan(0);
      expect(Array.isArray(m.needs)).toBe(true);
      expect(m.needs.length).toBeGreaterThan(0);
      expect(m.resultShape.length).toBeGreaterThan(0);
      expect(Array.isArray(m.limitations)).toBe(true);
    }
  });

  it("key matches name (registry keys mirror domain registries)", () => {
    for (const [key, m] of Object.entries(NUMERICAL_METHODS)) {
      expect(key).toBe(m.name);
    }
  });

  it("exposes at least one ODE method", () => {
    const odes = methodsByFamily("ODESolver");
    expect(odes.length).toBeGreaterThan(0);
    expect(odes.map((m) => m.name)).toEqual(expect.arrayContaining(["euler", "heun", "rk2", "rk4", "rkf45"]));
  });

  it("exposes at least one linear-solver and one optimizer", () => {
    expect(methodsByFamily("LinearSolver").length).toBeGreaterThan(0);
    expect(methodsByFamily("Optimizer").length).toBeGreaterThan(0);
  });

  it("adaptive methods document their tolerances in needs", () => {
    const rkf45 = numericalMethod("rkf45");
    expect(rkf45).toBeDefined();
    expect(rkf45!.needs).toEqual(expect.arrayContaining(["absTol", "relTol"]));
  });

  it("limitations are honest about local vs global", () => {
    for (const m of methodsByFamily("Optimizer")) {
      expect(m.limitations.some((l) => /local|global/i.test(l))).toBe(true);
    }
  });

  it("numericalMethod returns undefined for an unknown name (not throws)", () => {
    expect(numericalMethod("not-a-method")).toBeUndefined();
  });

  it("registeredFamilies deduplicates", () => {
    const f = registeredFamilies();
    expect(new Set(f).size).toBe(f.length);
  });
});
