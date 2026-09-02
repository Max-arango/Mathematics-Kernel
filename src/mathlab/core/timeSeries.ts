// First-class time-series object (spec §59). A TimeSeries is a 1-D sequence of
// (t_i, y_i) samples with optional metadata (name, source, units). It is the
// shared shape used by ODE, PDE, dynamics, and experimental data so downstream
// code (statistics, visualization, regression) does not need to know which
// domain produced the data.
//
// Storage is intentionally trivial: two number arrays of equal length plus a
// metadata object. Validation rejects non-finite values, mismatched lengths,
// and non-monotone t (when `monotone=true` is requested). The type is
// immutable in the same "constructor copies + accessor returns fresh arrays"
// style as mathlab/statistics/dataset.ts.
import { InvalidInputError } from "../core/errors.ts";

export interface TimeSeriesMeta {
  name?: string;
  /** Free-form provenance (e.g. "rk4 integration of logistic ODE"). */
  source?: string;
  /** SI-ish unit label (free-form string; unit system lives in mathlab/units). */
  units?: string;
  /** Extra key-value pairs that callers may want to attach (seed, parameters). */
  extra?: Record<string, unknown>;
}

export interface TimeSeries {
  t: number[];
  y: number[];
  meta: TimeSeriesMeta;
}

function checkFinite(x: number, where: string): void {
  if (typeof x !== "number" || !Number.isFinite(x)) {
    throw new InvalidInputError(`${where} must be a finite number (got ${x})`);
  }
}

/**
 * Build a TimeSeries. Validates length, finiteness, and (by default) that t is
 * strictly increasing. The returned TimeSeries owns its arrays (defensive copies).
 */
export function makeTimeSeries(t: number[], y: number[], meta: TimeSeriesMeta = {}, opts: { monotone?: boolean } = {}): TimeSeries {
  const monotone = opts.monotone !== false;
  if (!Array.isArray(t) || !Array.isArray(y)) {
    throw new InvalidInputError("t and y must be arrays");
  }
  if (t.length !== y.length) {
    throw new InvalidInputError(`t.length (${t.length}) ≠ y.length (${y.length})`);
  }
  for (let i = 0; i < t.length; i++) {
    checkFinite(t[i], `t[${i}]`);
    checkFinite(y[i], `y[${i}]`);
    if (monotone && i > 0 && t[i] <= t[i - 1]) {
      throw new InvalidInputError(`t must be strictly increasing (t[${i - 1}]=${t[i - 1]} ≥ t[${i}]=${t[i]})`);
    }
  }
  return {
    t: t.slice(),
    y: y.slice(),
    meta: { ...meta, ...(meta.extra ? { extra: { ...meta.extra } } : {}) },
  };
}

/** Read the i-th sample as a fresh [t, y] tuple. */
export function sampleAt(ts: TimeSeries, i: number): [number, number] {
  if (!Number.isInteger(i) || i < 0 || i >= ts.t.length) {
    throw new InvalidInputError(`index ${i} out of range [0, ${ts.t.length})`);
  }
  return [ts.t[i], ts.y[i]];
}

/** Time span t[last] − t[0]. Returns 0 for a single-point series. */
export function duration(ts: TimeSeries): number {
  return ts.t.length === 0 ? 0 : ts.t[ts.t.length - 1] - ts.t[0];
}

/** Map a function over (t, y) to produce a new TimeSeries; metadata is copied. */
export function mapTimeSeries(ts: TimeSeries, f: (t: number, y: number) => number): TimeSeries {
  const y = new Array(ts.t.length);
  for (let i = 0; i < ts.t.length; i++) y[i] = f(ts.t[i], ts.y[i]);
  return makeTimeSeries(ts.t, y, ts.meta, { monotone: false });
}

/** Sub-range [t0, t1] of the series (inclusive on both ends). */
export function sliceTimeSeries(ts: TimeSeries, t0: number, t1: number): TimeSeries {
  if (t0 > t1) throw new InvalidInputError(`t0 (${t0}) must be ≤ t1 (${t1})`);
  const i0 = ts.t.findIndex((x) => x >= t0);
  const i1 = ts.t.findIndex((x) => x > t1);
  const lo = i0 < 0 ? ts.t.length : i0;
  const hi = i1 < 0 ? ts.t.length : i1;
  return makeTimeSeries(ts.t.slice(lo, hi), ts.y.slice(lo, hi), ts.meta, { monotone: false });
}

/** Convert a uniform-step ODE/PDE result to a TimeSeries. */
export function fromUniform(t0: number, t1: number, samples: number[], meta: TimeSeriesMeta = {}): TimeSeries {
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) throw new InvalidInputError("t0/t1 must be finite");
  if (t1 < t0) throw new InvalidInputError(`t1 must be ≥ t0 (got ${t0}, ${t1})`);
  const n = samples.length;
  if (n === 0) return makeTimeSeries([], [], meta, { monotone: false });
  if (n === 1) return makeTimeSeries([t0], samples, meta, { monotone: false });
  // Solver convention: t[0] === t0, t[last] === t1.
  const t = new Array(n);
  for (let i = 0; i < n; i++) t[i] = t0 + ((t1 - t0) * i) / (n - 1);
  return makeTimeSeries(t, samples, meta);
}
