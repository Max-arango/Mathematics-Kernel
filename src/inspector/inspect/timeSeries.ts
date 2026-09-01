// Time-series inspector. The `timeSeries` MathObject kind is a 1-D sequence of
// (t_i, y_i) pairs; this inspector reports LENGTH, RANGE (t-min/max/y-min/max),
// and STEPS (median Δt, Δt spread, monotonic flag), DESCRIPTIVE (mean/median/stdev
// of y), and a TREND section (signed slope from a simple least-squares fit on y
// vs t — honest about being a linear approximation).
//
// HONESTY: the trend slope is a numerical regression coefficient, not a
// guarantee of physical meaning. A slope of 0.0 is reported when no trend is
// detectable. Monotonicity is on `t`, not `y`. y[t] is treated as a sequence
// even when t is non-uniform (the step section reports that honestly).
import { InvalidInputError } from "../../mathlab/core/errors.ts";
import { summary } from "../../mathlab/statistics/descriptive.ts";
import { type InspectionResult, type Capability, prop, section } from "../types.ts";

export function inspectTimeSeries(t: number[], y: number[]): InspectionResult {
  if (!Array.isArray(t) || !Array.isArray(y)) {
    return {
      kind: "timeSeries", identity: "Invalid time series",
      sections: [], relations: [], capabilities: [],
      warnings: ["t and y must both be arrays"],
    };
  }
  if (t.length !== y.length) {
    return {
      kind: "timeSeries", identity: "Invalid time series",
      sections: [], relations: [], capabilities: [],
      warnings: [`t.length (${t.length}) ≠ y.length (${y.length})`],
    };
  }
  if (t.length === 0) {
    return {
      kind: "timeSeries", identity: "Empty time series",
      sections: [], relations: [], capabilities: [], warnings: [],
    };
  }
  for (let i = 0; i < t.length; i++) {
    if (!Number.isFinite(t[i]) || !Number.isFinite(y[i])) {
      return {
        kind: "timeSeries", identity: "Non-finite time series",
        sections: [], relations: [], capabilities: [],
        warnings: [`non-finite value at index ${i}`],
      };
    }
  }

  const warnings: string[] = [];
  const caps: Capability[] = ["graph", "trajectory"];
  const sections = [];

  // ── Length & range ──────────────────────────────────────────────────────────
  let tMin = t[0], tMax = t[0], yMin = y[0], yMax = y[0];
  for (let i = 1; i < t.length; i++) {
    if (t[i] < tMin) tMin = t[i];
    if (t[i] > tMax) tMax = t[i];
    if (y[i] < yMin) yMin = y[i];
    if (y[i] > yMax) yMax = y[i];
  }
  sections.push(section("Length & range", [
    prop("Samples", String(t.length), "exact"),
    prop("t range", `[${round(tMin)}, ${round(tMax)}]`, "exact"),
    prop("y range", `[${round(yMin)}, ${round(yMax)}]`, "exact"),
  ]));

  // ── Steps ─────────────────────────────────────────────────────────────────────
  if (t.length >= 2) {
    const dt: number[] = [];
    let monotone = true;
    for (let i = 1; i < t.length; i++) {
      dt.push(t[i] - t[i - 1]);
      if (t[i] <= t[i - 1]) monotone = false;
    }
    let dMin = dt[0], dMax = dt[0];
    for (let i = 1; i < dt.length; i++) {
      if (dt[i] < dMin) dMin = dt[i];
      if (dt[i] > dMax) dMax = dt[i];
    }
    const dMedian = (() => {
      const s = [...dt].sort((a, b) => a - b);
      const mid = s.length >> 1;
      return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    })();
    // Uniform up to a tiny floating-point tolerance: relative to the median step size.
    const tol = Math.max(1e-12, Math.abs(dMedian) * 1e-12);
    const uniform = (dMax - dMin) <= tol;
    sections.push(section("Steps", [
      prop("Δt median", String(round(dMedian)), "exact"),
      prop("Δt spread", `[${round(dMin)}, ${round(dMax)}]`, "exact"),
      prop("Δt monotone (increasing)", monotone ? "yes" : "no", "exact"),
      prop("Δt uniform", uniform ? "yes (uniform within tolerance)" : `no (spread ${round(dMax - dMin)})`, "exact"),
    ]));
  }

  // ── Descriptive (y) ──────────────────────────────────────────────────────────
  try {
    const s = summary(y);
    sections.push(section("y descriptive", [
      prop("Mean", String(round(s.mean)), "numerical"),
      prop("Median", String(round(s.median)), "numerical"),
      prop("Std. dev. (sample)", String(round(s.stdev)), "numerical"),
      prop("Q1 / Q3", `${round(s.q1)} / ${round(s.q3)}`, "numerical"),
    ]));
  } catch (e) {
    warnings.push(`descriptive failed: ${e instanceof Error ? e.message : e}`);
  }

  // ── Linear trend (least-squares slope of y on t) ─────────────────────────────
  if (t.length >= 2) {
    const { slope, intercept } = linreg(t, y);
    sections.push(section("Linear trend (least-squares y ≈ a + b·t)", [
      prop("Slope b", String(round(slope)), "numerical", { note: "signed; 0 means no detectable linear trend" }),
      prop("Intercept a", String(round(intercept)), "numerical"),
    ]));
  }

  const relations = [
    { label: "Trajectory", description: "the (t, y) sequence", target: null },
    { label: "Descriptive stats", description: "summary of y", target: null },
  ];

  return {
    kind: "timeSeries",
    identity: `Time series — ${t.length} samples over t ∈ [${round(tMin)}, ${round(tMax)}]`,
    sections, relations, capabilities: caps, warnings,
  };
}

// Linear regression of y on t. Closed-form OLS; documented in statistics/regression.ts.
function linreg(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  if (n < 2) throw new InvalidInputError("linreg needs at least 2 points");
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
  mx /= n; my /= n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) * (xs[i] - mx); }
  if (den === 0) return { slope: 0, intercept: my };
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

const round = (v: number) => (Number.isFinite(v) ? Number(v.toPrecision(6)) : v);
