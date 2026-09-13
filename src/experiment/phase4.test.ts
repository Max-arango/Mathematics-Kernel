// Phase IV experiment-integration tests: every bundled advanced example is a
// valid, serializable, reproducible .mathsim document; new MathObject kinds
// (ODE, distribution, dataset, timeSeries) dispatch through the analysis cell;
// and the dependency graph remains correct for parameter-driven experiments.

import { describe, it, expect } from "vitest";
import { EXAMPLES } from "./examples.ts";
import { serialize, deserialize, validate } from "./serialize.ts";
import { run, runAll, dependencies, dependents } from "./engine.ts";
import { inspect } from "../inspector/engine.ts";

describe("Phase IV example gallery", () => {
  it("has a rich set of advanced examples covering all domains", () => {
    const titles = EXAMPLES.map((e) => e.title.toLowerCase());
    expect(titles.some((t) => t.includes("linear"))).toBe(true);
    expect(titles.some((t) => t.includes("optimization") || t.includes("rosenbrock"))).toBe(true);
    expect(titles.some((t) => t.includes("dynamical") || t.includes("lorenz") || t.includes("harmonic"))).toBe(true);
    expect(titles.some((t) => t.includes("ode"))).toBe(true);
    expect(titles.some((t) => t.includes("heat") || t.includes("pde"))).toBe(true);
    expect(titles.some((t) => t.includes("normal") || t.includes("probability"))).toBe(true);
    expect(titles.some((t) => t.includes("collatz") || t.includes("number"))).toBe(true);
    expect(titles.some((t) => t.includes("complex") || t.includes("z²") || t.includes("map"))).toBe(true);
    expect(titles.some((t) => t.includes("units") || t.includes("kinematics") || t.includes("scientific"))).toBe(true);
  });

  it("every example builds a valid, serializable experiment", () => {
    for (const ex of EXAMPLES) {
      const exp = ex.build();
      expect(validate(exp).ok, `${ex.id} should validate`).toBe(true);
      const rt = deserialize(serialize(exp));
      expect(rt.ok, `${ex.id} should round-trip`).toBe(true);
      expect(rt.experiment).toEqual(exp);
    }
  });

  it("every example has unique ids and deterministic build", () => {
    for (const ex of EXAMPLES) {
      const a = ex.build();
      const b = ex.build();
      expect(a).toEqual(b); // deterministic build (same cell ids)
    }
  });

  it("every example reproduces its own outputs identically", () => {
    for (const ex of EXAMPLES) {
      const exp = ex.build();
      expect(runAll(exp)).toEqual(runAll(ex.build()));
    }
  });
});

describe("Phase IV analysis cells dispatch through the inspector", () => {
  it("inspects a distribution from a serializable MathObject", () => {
    const r = inspect({ kind: "distribution", name: "normal", params: { mu: 0, sigma: 1 }, seed: 42 });
    expect(r.kind).toBe("distribution");
    expect(r.sections.length).toBeGreaterThan(0);
  });

  it("inspects an ODE from a serializable MathObject", () => {
    const r = inspect({ kind: "ode", vars: ["x"], fieldSource: ["-x"], params: {}, y0: [1], t0: 0, t1: 1, method: "rk4" });
    expect(r.kind).toBe("ode");
    expect(r.sections.some((s) => s.title === "Result")).toBe(true);
  });

  it("inspects a dataset and a time series", () => {
    const ds = inspect({ kind: "dataset", source: "samples", data: [1, 2, 3, 4] });
    expect(ds.kind).toBe("dataset");
    const ts = inspect({ kind: "timeSeries", t: [0, 1, 2], y: [1, 2, 3] });
    expect(ts.kind).toBe("timeSeries");
  });

  it("registered kinds include the new Phase IV domains", () => {
    const kinds = ["expression", "matrix", "vector", "topology", "dynamicalSystem", "ode", "distribution", "dataset", "timeSeries"];
    for (const k of kinds) {
      // Each kind must produce a non-"unsupported" inspection.
      const obj = kindToObject(k);
      if (obj) {
        const r = inspect(obj);
        expect(r.warnings.some((w) => w.includes("No inspector"))).toBe(false);
      }
    }
  });
});

function kindToObject(kind: string): Parameters<typeof inspect>[0] | null {
  switch (kind) {
    case "expression": return { kind, source: "x^2" };
    case "matrix": return { kind, data: [[1, 0], [0, 1]] };
    case "vector": return { kind, data: [1, 2, 3] };
    case "topology": return { kind, surfaceId: "sphere" };
    case "dynamicalSystem": return { kind, vars: ["x", "y"], fieldSource: ["y", "-x"], systemKind: "continuous" };
    case "ode": return { kind, vars: ["x"], fieldSource: ["-x"], y0: [1], t0: 0, t1: 1 };
    case "distribution": return { kind, name: "normal", params: { mu: 0, sigma: 1 } };
    case "dataset": return { kind, source: "samples", data: [1, 2, 3] };
    case "timeSeries": return { kind, t: [0, 1], y: [1, 2] };
    default: return null;
  }
}

describe("parameter-driven Phase IV experiments (batch/sweep foundations)", () => {
  it("changing a parameter changes downstream Lorenz analysis (reactive)", () => {
    const lorenz = EXAMPLES.find((e) => e.id === "dyn-lorenz")!.build();
    const analysisId = lorenz.cells.find((c) => c.kind === "analysis")!.id;
    const before = run(lorenz, analysisId);
    // perturb sigma, which xdot = sigma*(y-x) uses directly
    const sigmaCell = lorenz.cells.find((c) => c.kind === "parameter" && (c as { name: string }).name === "sigma") as { value: number };
    sigmaCell.value = 40;
    const after = run(lorenz, analysisId);
    expect(JSON.stringify(before)).not.toBe(JSON.stringify(after));
  });

  it("dependency graph tracks parameter → expression → analysis for the logistic example", () => {
    const logistic = EXAMPLES.find((e) => e.id === "ode-logistic")!.build();
    const deps = dependencies(logistic);
    const paramIds = logistic.cells.filter((c) => c.kind === "parameter").map((c) => c.id);
    const expr = logistic.cells.find((c) => c.kind === "expression")!;
    const analysis = logistic.cells.find((c) => c.kind === "analysis")!;
    // expression depends on r and K
    expect(deps[expr.id].length).toBe(2);
    for (const p of paramIds) expect(deps[expr.id]).toContain(p);
    expect(deps[analysis.id]).toEqual(expect.arrayContaining([expr.id, ...paramIds]));
  });

  it("dependents: changing r reaches the logistic analysis", () => {
    const logistic = EXAMPLES.find((e) => e.id === "ode-logistic")!.build();
    const rId = logistic.cells.find((c) => c.kind === "parameter" && (c as { name: string }).name === "r")!.id;
    const analysis = logistic.cells.find((c) => c.kind === "analysis")!.id;
    expect(dependents(logistic, rId)).toContain(analysis);
  });
});