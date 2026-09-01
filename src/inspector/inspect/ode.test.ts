// Tests for the ODE inspector. The `ode` kind was declared in types.ts but
// unregistered until Phase IV: these tests pin the inspector's structure, its
// graceful degradation on bad input, and a numerical cross-check against an
// analytical solution for the simplest exponential-decay case.

import { describe, expect, it } from "vitest";
import { inspect } from "../engine.ts";
import { inspectODE } from "./ode.ts";

describe("inspectODE", () => {
  // dx/dt = -x, y(0) = 1 ⇒ y(t) = e^(-t)
  const EXP = { vars: ["x"], fieldSource: ["-x"], params: {}, y0: [1], t0: 0, t1: 2 };

  it("returns an ODE inspection with the four expected sections", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1);
    expect(r.kind).toBe("ode");
    expect(r.identity).toContain("ℝ^1");
    const titles = r.sections.map((s) => s.title);
    expect(titles).toContain("Equation");
    expect(titles).toContain("Initial conditions");
    expect(titles).toContain("Result");
    expect(titles).toContain("Local linearization (Jacobian at y₀)");
  });

  it("emits Equation properties with LaTeX per state variable", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1);
    const eq = r.sections.find((s) => s.title === "Equation")!;
    expect(eq.properties.some((p) => p.label === "dx/dt" && p.latex?.includes("\\dot{x}"))).toBe(true);
  });

  it("reports the requested solver with order + adaptivity", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1, "rk4");
    const ic = r.sections.find((s) => s.title === "Initial conditions")!;
    const solver = ic.properties.find((p) => p.label === "Solver")!;
    expect(solver.value).toContain("rk4");
    expect(solver.value).toContain("order 4");
    expect(solver.value).toContain("fixed-step");
  });

  it("defaults to rk4 when an unknown method name is supplied", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1, "not-a-method");
    const ic = r.sections.find((s) => s.title === "Initial conditions")!;
    expect(ic.properties.find((p) => p.label === "Solver")!.value).toContain("rk4");
  });

  it("Result section shows convergence and a numerical final state", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1);
    const res = r.sections.find((s) => s.title === "Result")!;
    const conv = res.properties.find((p) => p.label === "Converged")!;
    expect(conv.value).toBe("yes");
    const final = res.properties.find((p) => p.label === "Final state y(t₁)")!;
    expect(final.confidence).toBe("numerical");
    expect(final.value).toMatch(/\(/);
  });

  it("RK4 final value tracks e^(-2) ≈ 0.1353 within a small tolerance", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1, "rk4");
    const res = r.sections.find((s) => s.title === "Result")!;
    const final = res.properties.find((p) => p.label === "Final state y(t₁)")!;
    const y = Number(final.value.replace(/[()]/g, "").split(",")[0]);
    expect(Math.abs(y - Math.exp(-2))).toBeLessThan(1e-3);
  });

  it("adaptive method exposes accepted/rejected/error metadata", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1, "rkf45");
    const res = r.sections.find((s) => s.title === "Result")!;
    expect(res.properties.some((p) => p.label === "Accepted steps")).toBe(true);
    expect(res.properties.some((p) => p.label === "Rejected steps")).toBe(true);
    expect(res.properties.some((p) => p.label === "Max estimated local error")).toBe(true);
  });

  it("stability section is honest about a non-equilibrium probe", () => {
    // For x'=-x, y0=1 is NOT an equilibrium (F(1)=-1), so the section must say so.
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1);
    const stab = r.sections.find((s) => s.title.startsWith("Local linearization"))!;
    const note = stab.properties.find((p) => p.label === "Type")!.note ?? "";
    expect(note).toMatch(/not an equilibrium/i);
  });

  it("stability section classifies an equilibrium as a sink (stable)", () => {
    // x' = -x, y0=0 is an equilibrium; linearization λ=-1 ⇒ stable.
    const r = inspectODE(["x"], ["-x"], {}, [0], 0, 1);
    const stab = r.sections.find((s) => s.title.startsWith("Local linearization"))!;
    const note = stab.properties.find((p) => p.label === "Type")!.note ?? "";
    expect(note).toMatch(/equilibrium/i);
    expect(stab.properties.find((p) => p.label === "Type")!.value).toMatch(/stable|sink/i);
  });

  it("reports Parameters when the RHS uses them", () => {
    // dx/dt = -r·x with r = 2 ⇒ same exponential but parameter shows up.
    const r = inspectODE(["x"], ["-r*x"], { r: 2 }, [1], 0, 1);
    const eq = r.sections.find((s) => s.title === "Equation")!;
    expect(eq.properties.some((p) => p.label === "Parameters" && p.value.includes("r = 2"))).toBe(true);
  });

  it("emits the equation as LaTeX", () => {
    const r = inspectODE(["x", "y"], ["y", "-x"], {}, [1, 0], 0, 1);
    expect(r.latex).toContain("\\dot{x}");
    expect(r.latex).toContain("\\dot{y}");
    expect(r.latex).toContain("\\begin{cases}");
  });

  it("degrades gracefully on an invalid RHS (unknown symbol)", () => {
    const r = inspectODE(["x"], ["q"], {}, [1], 0, 1);
    expect(r.kind).toBe("ode");
    expect(r.identity).toBe("Invalid ODE");
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("degrades gracefully on mismatched field length", () => {
    const r = inspectODE(["x", "y"], ["-x"], {}, [1, 0], 0, 1);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("capabilities advertise odeSolve, trajectory, and stability", () => {
    const r = inspectODE(EXP.vars, EXP.fieldSource, EXP.params, EXP.y0, EXP.t0, EXP.t1);
    expect(r.capabilities).toContain("odeSolve");
    expect(r.capabilities).toContain("trajectory");
    expect(r.capabilities).toContain("stability");
  });

  it("registers through the engine's MathObject dispatch", () => {
    const r = inspect({ kind: "ode", vars: EXP.vars, fieldSource: EXP.fieldSource, params: EXP.params, y0: EXP.y0, t0: EXP.t0, t1: EXP.t1, method: "rk4" });
    expect(r.kind).toBe("ode");
    expect(r.sections.length).toBeGreaterThan(0);
  });
});
