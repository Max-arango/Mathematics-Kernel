// Arbitrary 3D mathematical vector fields (Phase 2) — thin adapter over the shared
// dimension-generic dynamical-system engine (mathlab/dynamics/system.ts). This is
// INDEPENDENT of the N-body gravity model in field.ts/potential.ts: a user-defined
// F: R³ -> R³ (dx/dt, dy/dt, dz/dt as arbitrary expressions), not a physical field.
//
// No new parser/evaluator/ODE solver: evalField/jacobianField already handle N-D
// symbolic fields (ADR-003); this file only packs/unpacks the 3-vector and enforces
// the vars.length === 3 trust boundary. Integration reuses ode/registry.solveODE,
// same pattern as integrators.ts::stepRK4.
import { InvalidInputError } from "../core/errors.ts";
import { evalField, jacobianField, divergenceField, type DynamicalSystem } from "../dynamics/system.ts";
import { solveODE } from "../ode/registry.ts";
import type { ODEFn } from "../ode/types.ts";
import type { Vec3 } from "./types.ts";

function assert3D(sys: DynamicalSystem): void {
  if (sys.vars.length !== 3) {
    throw new InvalidInputError(
      `mathField3D requires a 3-variable system, got ${sys.vars.length} var(s) [${sys.vars.join(", ")}]`,
    );
  }
}

/** Evaluate the user field at a 3D point. Throws if `sys` isn't a 3-variable system. */
export function evalMathField3D(sys: DynamicalSystem, p: Vec3): Vec3 {
  assert3D(sys);
  const v = evalField(sys, p);
  return [v[0], v[1], v[2]];
}

/**
 * Curl of the user field at a 3D point, ∇×F = (∂Fz/∂y−∂Fy/∂z, ∂Fx/∂z−∂Fz/∂x,
 * ∂Fy/∂x−∂Fx/∂y). Only defined in 3D (unlike divergenceField, which is
 * dimension-generic), so it lives here rather than in dynamics/system.ts.
 * Built from the shared symbolic jacobianField — no separate differentiation.
 */
export function curlField3D(sys: DynamicalSystem, p: Vec3): Vec3 {
  assert3D(sys);
  const j = jacobianField(sys, p);
  return [
    j[2][1] - j[1][2],
    j[0][2] - j[2][0],
    j[1][0] - j[0][1],
  ];
}

export type MathIntegrator = "rk4" | "rkf45";

export interface MathTrajectoryStep {
  x1: Vec3;
  t1: number;
}

/** Advance one step of dx/dt = field(x) from x0 by dt via the shared ODE registry. */
export function stepMathTrajectory3D(
  sys: DynamicalSystem,
  x0: Vec3,
  dt: number,
  method: MathIntegrator = "rk4",
): MathTrajectoryStep {
  assert3D(sys);
  if (!(dt > 0)) return { x1: [...x0], t1: 0 };
  const f: ODEFn = (_t, y) => evalMathField3D(sys, [y[0], y[1], y[2]]);
  const res = solveODE(method, { f, y0: x0, t0: 0, t1: dt }, { h: dt, steps: 1 });
  // A non-finite step is dropped by the solver (res.y stays at the last finite
  // state); surface it honestly as a non-finite x1 rather than silently freezing.
  if (res.termination === "non-finite") return { x1: [NaN, NaN, NaN], t1: dt };
  const yEnd = res.y[res.y.length - 1];
  return { x1: [yEnd[0], yEnd[1], yEnd[2]], t1: res.t[res.t.length - 1] };
}

export interface Box3 { min: Vec3; max: Vec3; }

export type Termination3D = "escaped" | "non-finite" | "max-steps";

export interface TraceOptions3D {
  method?: MathIntegrator;
  dt?: number;
  /** Per-step cap — a few lines, not lifecycle.ts's 2D viewport state machine (ADR-003). */
  maxSteps?: number;
  bounds?: Box3;
}

export interface TraceResult3D {
  points: Vec3[];
  termination: Termination3D | "completed";
}

const DEFAULT_BOUNDS: Box3 = { min: [-1e3, -1e3, -1e3], max: [1e3, 1e3, 1e3] };

/**
 * Integrate a particle probe through the field from x0, sampling one point per step,
 * until it escapes `bounds`, goes non-finite, or hits `maxSteps` ("completed" if the
 * loop runs out of steps without either — i.e. `maxSteps` reached normally).
 */
export function traceMathTrajectory3D(
  sys: DynamicalSystem,
  x0: Vec3,
  opts: TraceOptions3D = {},
): TraceResult3D {
  assert3D(sys);
  const dt = opts.dt ?? 0.05;
  const maxSteps = opts.maxSteps ?? 2000;
  const bounds = opts.bounds ?? DEFAULT_BOUNDS;
  const method = opts.method ?? "rk4";

  const points: Vec3[] = [x0];
  let x = x0;
  for (let i = 0; i < maxSteps; i++) {
    const { x1 } = stepMathTrajectory3D(sys, x, dt, method);
    if (x1.some((c) => !Number.isFinite(c))) return { points, termination: "non-finite" };
    points.push(x1);
    x = x1;
    if (
      x1[0] < bounds.min[0] || x1[0] > bounds.max[0] ||
      x1[1] < bounds.min[1] || x1[1] > bounds.max[1] ||
      x1[2] < bounds.min[2] || x1[2] > bounds.max[2]
    ) {
      return { points, termination: "escaped" };
    }
  }
  return { points, termination: "max-steps" };
}

export interface MathFieldGridSample {
  points: Vec3[];
  vectors: Vec3[];
}

/** Pin one axis to a fixed value — confines a grid sample to that 2D plane. */
export interface GridSlice {
  axis: "x" | "y" | "z";
  value: number;
}

const AXIS_INDEX: Record<"x" | "y" | "z", 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

function gridLerp(lo: number, hi: number, i: number, n: number): number {
  return n === 1 ? (lo + hi) / 2 : lo + ((hi - lo) * i) / (n - 1);
}

/**
 * Grid point positions over `bounds` at `resolution` per axis: the full
 * resolution³ box, or — when `slice` is given — the resolution² plane where
 * `slice.axis` is pinned to `slice.value`. Shared by every sample*Grid3D
 * function below so they can't disagree on which points they sample (and the
 * field/Jacobian is evaluated exactly once per point per sampler).
 */
function gridPoints3D(bounds: Box3, resolution: number, slice?: GridSlice): Vec3[] {
  if (!Number.isInteger(resolution) || resolution < 1) {
    throw new InvalidInputError(`resolution must be a positive integer, got ${resolution}`);
  }
  const n = resolution;
  const points: Vec3[] = [];
  if (slice) {
    const pinned = AXIS_INDEX[slice.axis];
    const [a0, a1] = ([0, 1, 2] as const).filter((a) => a !== pinned);
    for (let i = 0; i < n; i++) {
      const u = gridLerp(bounds.min[a0], bounds.max[a0], i, n);
      for (let j = 0; j < n; j++) {
        const v = gridLerp(bounds.min[a1], bounds.max[a1], j, n);
        const p: Vec3 = [0, 0, 0];
        p[pinned] = slice.value; p[a0] = u; p[a1] = v;
        points.push(p);
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      const x = gridLerp(bounds.min[0], bounds.max[0], i, n);
      for (let j = 0; j < n; j++) {
        const y = gridLerp(bounds.min[1], bounds.max[1], j, n);
        for (let k = 0; k < n; k++) {
          const z = gridLerp(bounds.min[2], bounds.max[2], k, n);
          points.push([x, y, z]);
        }
      }
    }
  }
  return points;
}

/**
 * Sample the field on a resolution³ grid over `bounds` — for drawing arrows. Cached
 * on demand by the caller (recompute only when source/params/resolution change);
 * not allocated per animation frame. With `slice` omitted, behavior is identical
 * to the pre-slice version of this function (same point order, same lerp); with
 * `slice` given, samples only the 2D plane where `slice.axis === slice.value`.
 */
export function sampleMathFieldGrid3D(
  sys: DynamicalSystem,
  bounds: Box3,
  resolution: number,
  slice?: GridSlice,
): MathFieldGridSample {
  assert3D(sys);
  const points = gridPoints3D(bounds, resolution, slice);
  const vectors = points.map((p) => evalMathField3D(sys, p));
  return { points, vectors };
}

export interface MathFieldDivergenceSample {
  points: Vec3[];
  values: number[];
}

/** Sample ∇·F on a resolution³ grid (or a `slice` plane) — same shape/semantics
 * as sampleMathFieldGrid3D, one scalar divergence per point. */
export function sampleDivergenceGrid3D(
  sys: DynamicalSystem,
  bounds: Box3,
  resolution: number,
  slice?: GridSlice,
): MathFieldDivergenceSample {
  assert3D(sys);
  const points = gridPoints3D(bounds, resolution, slice);
  const values = points.map((p) => divergenceField(sys, p));
  return { points, values };
}

export interface MathFieldCurlSample {
  points: Vec3[];
  vectors: Vec3[];
}

/** Sample ∇×F on a resolution³ grid (or a `slice` plane) — same shape/semantics
 * as sampleMathFieldGrid3D, one curl vector per point. */
export function sampleCurlGrid3D(
  sys: DynamicalSystem,
  bounds: Box3,
  resolution: number,
  slice?: GridSlice,
): MathFieldCurlSample {
  assert3D(sys);
  const points = gridPoints3D(bounds, resolution, slice);
  const vectors = points.map((p) => curlField3D(sys, p));
  return { points, vectors };
}
