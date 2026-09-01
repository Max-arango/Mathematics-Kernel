// Dataset inspector. Inspects a `dataset` MathObject — a tabular row-major
// collection of columns (see statistics/dataset.ts for the shape). Reports the
// schema (columns, n, name), per-column univariate summaries (mean / median /
// stdev / min / max / quartiles) from statistics/descriptive, and a CORRELATIONS
// section listing the pairwise Pearson correlation between numeric columns.
//
// HONESTY: per-column summaries are labelled "numerical" (they're computed from
// a finite sample, not analytic). Correlations can be undefined when a column
// has zero variance — that case degrades with a warning rather than NaN.
import { makeDataset, type Dataset } from "../../mathlab/statistics/dataset.ts";
import { summary, correlation } from "../../mathlab/statistics/descriptive.ts";
import { InvalidInputError } from "../../mathlab/core/errors.ts";
import { type InspectionResult, type Capability, type Property, prop, section } from "../types.ts";

export interface DatasetObject {
  columns: string[];
  rows: number[][];
  name?: string;
}

/**
 * Inspect a dataset. `source` discriminates the shape:
 *   "samples" — `data` is a flat array (single column "x").
 *   "xy"      — `data` is a 2-column matrix of [[x1,y1],[x2,y2],…].
 *   "matrix"  — `data` is an N×K matrix; columns auto-named "c0"…"c{K−1}".
 */
export function inspectDataset(source: "samples" | "xy" | "matrix", data: number[] | number[][], name?: string): InspectionResult {
  let ds: Dataset;
  try {
    ds = buildDataset(source, data, name);
  } catch (e) {
    return {
      kind: "dataset",
      identity: "Invalid dataset",
      sections: [], relations: [], capabilities: [],
      warnings: [e instanceof Error ? e.message : String(e)],
    };
  }

  const warnings: string[] = [];
  const caps: Capability[] = ["graph", "compare"];
  const sections = [];

  // ── Schema ────────────────────────────────────────────────────────────────────
  const schemaProps: Property[] = [
    prop("Columns", ds.columns.join(", "), "exact"),
    prop("Rows (n)", String(ds.rows.length), "exact"),
    prop("Width (k)", String(ds.columns.length), "exact"),
  ];
  if (ds.name) schemaProps.push(prop("Name", ds.name, "exact"));
  sections.push(section("Schema", schemaProps));

  // ── Per-column summaries ─────────────────────────────────────────────────────
  const summaryProps: Property[] = [];
  for (let j = 0; j < ds.columns.length; j++) {
    const col = ds.rows.map((row) => row[j]);
    try {
      const s = summary(col);
      summaryProps.push(prop(ds.columns[j],
        `n=${s.n}, mean=${round(s.mean)}, median=${round(s.median)}, σ=${round(s.stdev)}, [${round(s.min)}, ${round(s.max)}]`,
        "numerical"));
    } catch (e) {
      summaryProps.push(prop(ds.columns[j], `(no summary: ${e instanceof Error ? e.message : e})`, "unsupported"));
    }
  }
  sections.push(section("Per-column summary", summaryProps));

  // ── Correlations (pairwise, only when k ≥ 2) ──────────────────────────────────
  if (ds.columns.length >= 2 && ds.rows.length >= 2) {
    const corrProps: Property[] = [];
    for (let i = 0; i < ds.columns.length; i++) {
      for (let j = i + 1; j < ds.columns.length; j++) {
        const xi = ds.rows.map((r) => r[i]);
        const xj = ds.rows.map((r) => r[j]);
        try {
          const r = correlation(xi, xj);
          corrProps.push(prop(`corr(${ds.columns[i]}, ${ds.columns[j]})`, round(r).toString(), "numerical",
            { note: `Pearson r ∈ [−1, 1]; 0 = uncorrelated, ±1 = linear` }));
        } catch (e) {
          warnings.push(`correlation(${ds.columns[i]}, ${ds.columns[j]}): ${e instanceof Error ? e.message : e}`);
        }
      }
    }
    sections.push(section("Correlations", corrProps));
  }

  const relations = [
    { label: "Column summary", description: "per-column n/mean/median/σ/min/max/q1/q3", target: null },
    { label: "Correlations", description: "Pearson r between numeric columns", target: null },
  ];

  return {
    kind: "dataset",
    identity: `Dataset — ${ds.rows.length} × ${ds.columns.length}${ds.name ? ` ("${ds.name}")` : ""}`,
    sections, relations, capabilities: caps, warnings,
  };
}

function buildDataset(source: "samples" | "xy" | "matrix", data: number[] | number[][], name?: string): Dataset {
  if (source === "samples") {
    if (!Array.isArray(data) || data.length === 0) {
      throw new InvalidInputError("samples must be a non-empty flat array");
    }
    if (Array.isArray(data[0])) {
      throw new InvalidInputError("samples source expects a flat array");
    }
    // row-major: each value becomes its own single-column row.
    const rows = (data as number[]).map((x) => [x]);
    return makeDataset(["x"], rows, name);
  }
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new InvalidInputError("xy/matrix source expects an array of arrays");
  }
  const mat = data as number[][];
  const width = mat[0].length;
  if (source === "xy") {
    if (width !== 2) throw new InvalidInputError(`xy source requires 2 columns, got ${width}`);
    return makeDataset(["x", "y"], mat.map((row) => row.slice()), name);
  }
  // matrix
  const labels = Array.from({ length: width }, (_, j) => `c${j}`);
  return makeDataset(labels, mat.map((row) => row.slice()), name);
}

const round = (v: number) => (Number.isFinite(v) ? Number(v.toPrecision(6)) : v);
