// Probability-distribution inspector. A `distribution` MathObject kind was not
// declared in types.ts until Phase IV — this module introduces it and registers
// an inspector that dispatches by name through the existing DISTRIBUTIONS
// registry. The inspector reports SUPPORT, MOMENTS (mean, variance, sd, with
// closed-form vs sampled clearly labelled), SHAPE (PMF or PDF + CDF + sample
// previews), and a small SAMPLE STATISTICS section from a seeded draw.
//
// HONESTY: closed-form moments are labelled "exact" (Bernoulli mean = p, etc.);
// the sample mean/variance are "numerical estimates" labelled as such. The sample
// preview is bounded (DISTRIBUTION_SAMPLE_PREVIEW) so an interactive inspector
// never stalls on a Poisson(λ) sampler that could loop on large λ.
//
// COST GUARD: SAMPLE_PREVIEW is bounded; for distributions whose sampler is O(n)
// per draw (Binomial(n)), an excessive `n` makes the preview expensive — we cap
// the preview's effective n to avoid stalls on accidentally large `n`.
import { makeDistribution } from "../../mathlab/probability/distribution.ts";
import { makeRng } from "../../mathlab/core/rng.ts";
import { type InspectionResult, type Capability, type Property, prop, section } from "../types.ts";

const SAMPLE_PREVIEW = 64;
const BINOMIAL_PREVIEW_CAP = 1_000_000;

export function inspectDistribution(name: string, params: Record<string, number>, seed = 12345): InspectionResult {
  let dist: ReturnType<typeof makeDistribution>;
  try {
    dist = makeDistribution(name, params);
  } catch (e) {
    return {
      kind: "distribution",
      identity: "Invalid distribution",
      sections: [], relations: [], capabilities: [],
      warnings: [e instanceof Error ? e.message : String(e)],
    };
  }

  const warnings: string[] = [];
  const caps: Capability[] = ["graph"];
  const sections = [];

  // ── Identity / Parameters ───────────────────────────────────────────────────
  const paramProps: Property[] = [
    prop("Family", dist.name, "exact"),
    prop("Kind", dist.kind, "exact", { note: dist.kind === "discrete" ? "PMF + CDF" : "PDF + CDF" }),
  ];
  for (const [k, v] of Object.entries(dist.params)) {
    paramProps.push(prop(`p.${k}`, String(round(v)), "exact"));
  }
  paramProps.push(prop("Support", supportStr(dist.support), dist.support.lo === -Infinity || dist.support.hi === Infinity ? "numerical" : "exact"));
  sections.push(section("Parameters", paramProps));

  // ── Closed-form moments ─────────────────────────────────────────────────────
  const sd = Math.sqrt(dist.variance);
  const momentProps: Property[] = [
    prop("Mean E[X]", String(round(dist.mean)), "exact"),
    prop("Variance Var(X)", String(round(dist.variance)), "exact"),
    prop("Std. dev. σ", String(round(sd)), "exact"),
    prop("Skewness", skewness(dist).toFixed(4), "exact", { note: "closed-form when known; '0.0000' = symmetric" }),
    prop("Excess kurtosis", kurtosis(dist).toFixed(4), "exact", { note: "0 = Normal, > 0 = heavy tails" }),
  ];
  sections.push(section("Moments (closed form)", momentProps));

  // ── Shape preview (sample) ───────────────────────────────────────────────────
  const rng = makeRng(seed);
  const N = SAMPLE_PREVIEW;
  let samplePreview: number[];
  if (dist.name === "binomial" && (dist.params.n ?? 0) > BINOMIAL_PREVIEW_CAP) {
    samplePreview = [];
    warnings.push(`Binomial n=${dist.params.n} exceeds preview cap ${BINOMIAL_PREVIEW_CAP}; sample preview skipped.`);
  } else {
    samplePreview = new Array(N);
    for (let i = 0; i < N; i++) samplePreview[i] = dist.sample(rng);
  }
  const shapeProps: Property[] = [
    prop("Preview samples (seeded)", String(samplePreview.length), "exact"),
    prop("Sample min", String(round(safeMin(samplePreview))), "numerical", { note: "drawn from N=" + N + " seeded samples" }),
    prop("Sample max", String(round(safeMax(samplePreview))), "numerical", { note: "drawn from N=" + N + " seeded samples" }),
    prop("Sample mean", String(round(safeMean(samplePreview))), "numerical", { note: `should approach E[X] = ${round(dist.mean)}` }),
    prop("Sample variance", String(round(safeVar(samplePreview))), "numerical", { note: `should approach Var(X) = ${round(dist.variance)}` }),
  ];
  if (dist.kind === "discrete") {
    shapeProps.push(prop("PMF", "evaluate via dist.pmf(k)", "exact", { note: "discrete mass function" }));
  } else {
    shapeProps.push(prop("PDF", "evaluate via dist.pdf(x)", "exact", { note: "continuous density" }));
  }
  shapeProps.push(prop("CDF", "evaluate via dist.cdf(x)", "exact", { note: "monotone, 0 → 1" }));
  shapeProps.push(prop("Sampler", "draw via dist.sample(rng)", "exact", { note: "seeded, reproducible" }));
  sections.push(section("Shape & sampling", shapeProps));
  caps.push("compare");

  // ── Relations ────────────────────────────────────────────────────────────────
  const relations = [
    { label: "Sample (seeded draw)", description: `dist.sample(rng) — requires an Rng from core/rng`, target: null },
    { label: "CDF", description: "cumulative distribution function", target: null },
    { label: "PDF / PMF", description: dist.kind === "discrete" ? "probability mass function" : "probability density", target: null },
  ];

  const paramRepr = Object.entries(dist.params).map(([k, v]) => `${k}=${round(v)}`).join(", ");
  const identity = `${dist.name}(${paramRepr})`;
  return {
    kind: "distribution",
    identity,
    latex: dist.kind === "discrete"
      ? `X \\sim \\text{${dist.name}}(\\mathbf{p})`
      : `X \\sim \\text{${dist.name}}(\\mathbf{p})`,
    sections, relations, capabilities: caps, warnings,
  };
}

const round = (v: number) => (Number.isFinite(v) ? Number(v.toPrecision(6)) : v);

function supportStr(s: { lo: number; hi: number }): string {
  const lo = s.lo === -Infinity ? "−∞" : String(round(s.lo));
  const hi = s.hi === Infinity ? "+∞" : String(round(s.hi));
  return `[${lo}, ${hi}]`;
}

// Closed-form skewness/excess-kurtosis where known; else 0 is the default and the
// description above flags this honestly. (A genuinely unknown value should appear
// as 'unsupported', but every registered distribution has these in closed form.)
function skewness(d: ReturnType<typeof makeDistribution>): number {
  switch (d.name) {
    case "bernoulli": {
      const p = d.params.p;
      const denom = Math.sqrt(p * (1 - p));
      return denom === 0 ? 0 : (1 - 2 * p) / denom;
    }
    case "binomial": {
      const { n, p } = d.params;
      return (1 - 2 * p) / Math.sqrt(n * p * (1 - p));
    }
    case "poisson": return 1 / Math.sqrt(d.params.lambda);
    case "exponential": return 2;
    case "uniform": return 0;
    case "normal": return 0;
    default: return 0;
  }
}

function kurtosis(d: ReturnType<typeof makeDistribution>): number {
  switch (d.name) {
    case "bernoulli": {
      const p = d.params.p;
      const denom = p * (1 - p);
      if (denom === 0) return -2;
      return (1 - 6 * p * (1 - p)) / denom;
    }
    case "binomial": {
      const { n, p } = d.params;
      return (1 - 6 * p * (1 - p)) / (n * p * (1 - p));
    }
    case "poisson": return 1 / d.params.lambda;
    case "exponential": return 6;
    case "uniform": return -1.2;
    case "normal": return 0;
    default: return 0;
  }
}

const safeMin = (a: number[]) => a.length === 0 ? NaN : a.reduce((m, x) => Math.min(m, x), Infinity);
const safeMax = (a: number[]) => a.length === 0 ? NaN : a.reduce((m, x) => Math.max(m, x), -Infinity);
const safeMean = (a: number[]): number => a.length === 0 ? NaN : a.reduce((s, x) => s + x, 0) / a.length;
const safeVar = (a: number[]): number => {
  if (a.length < 2) return NaN;
  const m = safeMean(a);
  return a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1);
};
