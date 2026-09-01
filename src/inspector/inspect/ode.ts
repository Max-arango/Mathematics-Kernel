// ODE initial-value-problem inspector. The `ode` kind is declared in types.ts but
// was unregistered until Phase IV: this module builds a Mathematical Object the
// rest of the platform can dispatch to. The inspector solves the IVP with the
// stored (or default) method, then reports four sections: EQUATION (the RHS),
// INITIAL CONDITIONS (y0/t0/t1 + method), RESULT (samples, convergence,
// termination, error), and a LOCAL LINEARIZATION probe (Jacobian eigenvalues at
// y₀, classified only when y₀ happens to be an equilibrium).
//
// HONESTY: a numerical solution is labelled "numerical" everywhere; an "estimated
// error" from an adaptive method is a heuristic bound, not a guarantee. The solver
// is called with the same resource caps as everywhere else (MAX_ODE_STEPS etc.) so
// a pathological RHS degrades with a structured warning instead of hanging.
//
// COST GUARD: the Jacobian probe is skipped past a small state dimension
// (MAX_STABILITY_DIM) — building the Jacobian field is O(n²) symbolics and an
// interactive inspector must stay snappy on medium-sized IVPs.
import { makeSystem } from "../../mathlab/dynamics/system.ts";
import { classifyEquilibrium } from "../../mathlab/dynamics/stability.ts";
import { solveODE, ODE_METHODS } from "../../mathlab/ode/registry.ts";
import { InvalidInputError } from "../../mathlab/core/errors.ts";
import { print } from "../../mathlab/core/print.ts";
import { evaluate, type Env } from "../../mathlab/core/eval.ts";
import { type Complex } from "../../mathlab/complex/complex.ts";
import { type InspectionResult, type Capability, type Property, prop, section } from "../types.ts";
import type { Vec } from "../../mathlab/linear/vector.ts";

// Stability section is skipped past this state dimension — see dynamicalSystem.ts.
const MAX_STABILITY_DIM = 4;

/**
 * Inspect an ODE IVP. `fieldSource` is re-parsed through the dynamics system
 * builder to get a uniform view (continuous flow), then the IVP is solved and
 * result sections appended. Non-finite / unsolved IVPs degrade gracefully.
 */
export function inspectODE(
  vars: string[],
  fieldSource: string[],
  params: Record<string, number>,
  y0: number[],
  t0: number,
  t1: number,
  methodName?: string,
): InspectionResult {
  let sys: ReturnType<typeof makeSystem>;
  try {
    sys = makeSystem(vars, fieldSource, params, "continuous");
  } catch (e) {
    return {
      kind: "ode",
      identity: "Invalid ODE",
      sections: [], relations: [], capabilities: [],
      warnings: [e instanceof InvalidInputError ? e.message : String(e)],
    };
  }

  const n = vars.length;
  const warnings: string[] = [];
  const caps: Capability[] = ["odeSolve", "trajectory"];
  const sections = [];

  // ── Equation ──────────────────────────────────────────────────────────────────────
  const eqProps: Property[] = [
    prop("State variables", vars.join(", "), "exact"),
    prop("Dimension", `ℝ^${n}`, "exact"),
  ];
  sys.field.forEach((node, i) => {
    const rhs = print(node);
    eqProps.push(prop(`d${vars[i]}/dt`, rhs, "exact", { latex: `\\dot{${vars[i]}} = ${latexish(rhs)}` }));
  });
  if (Object.keys(params).length > 0) {
    eqProps.push(prop("Parameters", Object.entries(params).map(([k, v]) => `${k} = ${round(v)}`).join(", "), "exact"));
  }
  sections.push(section("Equation", eqProps));

  // ── Initial conditions & method ───────────────────────────────────────────────────
  const icProps: Property[] = [
    prop("Initial state y(t₀)", `(${y0.map(round).join(", ")})`, "exact", { latex: colVec(y0) }),
    prop("Time interval", `[${round(t0)}, ${round(t1)}]`, "exact", { latex: `t \\in [${round(t0)},\\ ${round(t1)}]` }),
  ];
  const name = methodName && ODE_METHODS[methodName] ? methodName : "rk4";
  const m = ODE_METHODS[name];
  icProps.push(prop("Solver", `${m.name} (order ${m.order}, ${m.adaptive ? "adaptive" : "fixed-step"})`, "exact", { note: m.description }));
  sections.push(section("Initial conditions", icProps));

  // ── Solve the IVP ─────────────────────────────────────────────────────────────────
  const f = (_t: number, y: Vec): Vec => {
    const envVars: Record<string, number> = { ...sys.params };
    for (let i = 0; i < sys.vars.length; i++) envVars[sys.vars[i]] = y[i] ?? 0;
    const env: Env = { vars: envVars, funcs: {} };
    return sys.field.map((node) => evaluate(node, env));
  };

  let result: ReturnType<typeof solveODE>;
  try {
    result = solveODE(name, { f, y0, t0, t1 });
  } catch (e) {
    return {
      kind: "ode",
      identity: `ODE on ℝ^${n}`,
      sections, relations: [], capabilities: caps,
      warnings: [...warnings, e instanceof Error ? e.message : String(e)],
    };
  }
  for (const w of result.warnings) warnings.push(w);

  const finalState = result.y[result.y.length - 1] ?? y0;
  const resProps: Property[] = [
    prop("Samples", String(result.t.length), "exact"),
    prop("Steps", String(result.steps), "exact"),
    prop("Termination", result.termination, "exact", { note: result.termination === "reached-t1" ? "solver reached the time endpoint" : "see warnings" }),
    prop("Converged", yn(result.converged), "exact"),
  ];
  if (m.adaptive) {
    resProps.push(prop("Accepted steps", String(result.accepted ?? 0), "exact"));
    resProps.push(prop("Rejected steps", String(result.rejected ?? 0), "exact"));
    if (result.errorEstimate !== undefined) {
      resProps.push(prop("Max estimated local error", result.errorEstimate.toPrecision(6), "estimated",
        { note: "RKF45: ‖y₅ − y₄‖∞; a local error bound, not a global guarantee" }));
    }
  }
  resProps.push(prop("Final state y(t₁)", `(${finalState.map(round).join(", ")})`, "numerical", { latex: colVec(finalState) }));
  sections.push(section("Result", resProps));

  // ── Local linearization probe ─────────────────────────────────────────────────────
  // Classify the flow at y₀. y₀ is almost never an equilibrium in practice; we still
  // emit the Jacobian spectrum honestly and downgrade the verdict so the user doesn't
  // misread it as a stability claim.
  if (n > MAX_STABILITY_DIM) {
    warnings.push(`Stability skipped: state dimension ${n} exceeds the cap ${MAX_STABILITY_DIM}.`);
  } else {
    try {
      const probe = classifyEquilibrium(sys, y0);
      const probeMag = probe.eigenvalues.reduce((m: number, z: Complex) => Math.max(m, Math.hypot(z.re, z.im)), 0);
      const isEquilibrium = probe.eigenvalues.length > 0 && probeMag < 1e-9
        && (() => {
          // Cheap: also probe the FIELD magnitude. Equilibrium iff ‖F(y₀)‖ ≈ 0.
          // classifyEquilibrium doesn't expose this, so we evaluate directly.
          const env: Env = { vars: { ...sys.params, ...Object.fromEntries(sys.vars.map((v, i) => [v, y0[i] ?? 0])) }, funcs: {} };
          const F = sys.field.map((node) => evaluate(node, env));
          return F.reduce((s, x) => s + x * x, 0) < 1e-12;
        })();
      const note = isEquilibrium
        ? "linearized classification via Hartman–Grobman (probe point is an equilibrium)"
        : "probe point is not an equilibrium (F ≠ 0); eigenvalues are the local linearization, not a stability verdict";
      sections.push(section("Local linearization (Jacobian at y₀)", [
        prop("Type", probe.type, isEquilibrium ? probe.confidence : "inferred", { note }),
        prop("Jacobian spectrum", probe.eigenvalues.map(fmtC).join(", "), probe.confidence,
          { latex: `\\lambda = ${probe.eigenvalues.map(fmtCTex).join(",\\ ")}` }),
      ]));
      caps.push("stability");
    } catch (e) {
      warnings.push(`Jacobian probe failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Relations — describe-only cross-links.
  const relations = [
    { label: "Vector field", description: "RHS f(t, y) parsed into a continuous DynamicalSystem", target: null },
    { label: "Trajectory", description: "t, y samples from the solver", target: null },
  ];

  const eqs = sys.vars.map((v, i) => `\\dot{${v}} = ${latexish(print(sys.field[i]))}`);
  return {
    kind: "ode",
    identity: `ODE on ℝ^${n}`,
    latex: eqs.length === 1 ? eqs[0] : `\\begin{cases}${eqs.join(" \\\\ ")}\\end{cases}`,
    sections, relations, capabilities: caps, warnings,
  };
}

const round = (v: number) => (Number.isFinite(v) ? Number(v.toPrecision(6)) : v);
const yn = (b: boolean) => (b ? "yes" : "no");
const colVec = (v: number[]) => `\\begin{pmatrix}${v.map(round).join(" \\\\ ")}\\end{pmatrix}`;

const isRealEig = (z: Complex) => Math.abs(z.im) <= 1e-9 * Math.max(1, Math.abs(z.re), Math.abs(z.im));
const fmtC = (z: Complex): string => isRealEig(z) ? String(round(z.re)) : `${round(z.re)} ${z.im >= 0 ? "+" : "−"} ${round(Math.abs(z.im))}i`;
const fmtCTex = (z: Complex): string => isRealEig(z) ? `${round(z.re)}` : `${round(z.re)} ${z.im >= 0 ? "+" : "-"} ${round(Math.abs(z.im))}i`;

function latexish(s: string): string {
  return s
    .replace(/\bpi\b/g, "\\pi").replace(/·/g, "\\cdot ")
    .replace(/\b(sin|cos|tan|sec|csc|cot|asin|acos|atan|sinh|cosh|tanh|exp|ln|log|sqrt|cbrt|abs|sign)\b/g, "\\$1");
}
