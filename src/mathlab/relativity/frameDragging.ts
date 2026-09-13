// Frame dragging: the "zero angular momentum observer" (ZAMO) construction for
// any stationary, axisymmetric metric in (t, r, theta, phi)-like coordinates
// (index 0 = t, index 3 = phi — the same convention Minkowski/Schwarzschild/Kerr
// already use, coords[1]/coords[2] free). This is generic, NOT Kerr-specific:
// it is identically 0 whenever g_tphi=0 (Minkowski, Schwarzschild), which is
// itself the correct sanity check (no spin, no frame dragging).
//
// omega(x) = -g_tphi(x)/g_phiphi(x) is the coordinate angular velocity dphi/dt
// of a locally non-rotating (L=0) observer at x (see e.g. Bardeen, Press &
// Teukolsky 1972, or Hartle "Gravity" ch. 15). Because axisymmetry (d/dphi is
// a Killing vector) makes L = g_tphi u^t + g_phiphi u^phi a CONSERVED quantity
// along any geodesic in this metric family (already relied on by this repo's
// Schwarzschild/Kerr conserved-quantity tests), a geodesic launched with L=0
// (i.e. u^phi = omega(x0)*u^t at the start) stays L=0 for its entire
// trajectory, yet still has nonzero dphi/dtau wherever omega != 0 — that is
// frame dragging, directly observable with the existing geodesic integrator.
import { evalMetric, type MetricModel } from "./metric.ts";
import { domainError, exact, type MathResult } from "../core/result.ts";
import { InvalidInputError } from "../core/errors.ts";

const GPHIPHI_EPS = 1e-9;

/** omega(x) = -g_tphi/g_phiphi, the ZAMO coordinate angular velocity at x. */
export function zamoAngularVelocity(model: MetricModel, x: number[]): MathResult<number> {
  const g = evalMetric(model, x);
  const gphiphi = g[3][3];
  if (Math.abs(gphiphi) < GPHIPHI_EPS) {
    return domainError("g_phiphi vanishes at this point (degenerate rotation axis) — ZAMO angular velocity is undefined");
  }
  return exact(-g[0][3] / gphiphi);
}

/**
 * Build a full timelike-unit-norm 4-velocity with L=0 (zero angular momentum):
 * u^phi = omega(x)*u^t, with the given spatial u^r/u^theta (default 0 each).
 * Substituting u^phi into g_mu_nu u^mu u^nu = -1 gives a quadratic purely in
 * u^t — same A/B/C quadratic-solving and future-root-selection pattern as
 * normalize.ts::normalizeTimelikeVelocity, just with u^phi expressed via omega
 * instead of taken as a free input.
 */
export function zamoInitialVelocity(
  model: MetricModel,
  x: number[],
  spatial: { ur?: number; utheta?: number } = {},
): MathResult<number[]> {
  const n = model.coords.length;
  if (n !== 4) {
    throw new InvalidInputError("zamoInitialVelocity expects a 4-coordinate stationary axisymmetric metric [t,r,theta,phi]");
  }
  const omegaRes = zamoAngularVelocity(model, x);
  if (omegaRes.kind !== "exact") return omegaRes as MathResult<number[]>;
  const omega = omegaRes.value;

  const ur = spatial.ur ?? 0;
  const utheta = spatial.utheta ?? 0;
  const g = evalMetric(model, x);
  const u = [0, ur, utheta, 0]; // u^t (index 0) and u^phi (index 3) filled in via the quadratic below

  // u^mu = [y, ur, utheta, omega*y], unknown y = u^t. Expand
  // g_mu_nu u^mu u^nu = -1 as A*y^2 + B*y + C = 0.
  const A = g[0][0] + 2 * g[0][3] * omega + g[3][3] * omega * omega;
  let B = 0;
  for (const i of [1, 2]) B += 2 * g[0][i] * u[i] + 2 * g[3][i] * u[i] * omega;
  let C = 1;
  for (const i of [1, 2]) for (const j of [1, 2]) C += g[i][j] * u[i] * u[j];

  let roots: number[];
  if (A === 0) {
    if (B === 0) return domainError("g_00-effective and its coupling to u^0 both vanish — u^t is undetermined");
    roots = [-C / B];
  } else {
    const disc = B * B - 4 * A * C;
    if (disc < 0) return domainError("no real u^t solves the ZAMO timelike norm condition (spacelike configuration)");
    const sq = Math.sqrt(disc);
    roots = [(-B + sq) / (2 * A), (-B - sq) / (2 * A)];
  }

  const future = roots.filter((r) => Number.isFinite(r) && r > 0);
  if (future.length === 0) return domainError("no future-pointing (u^t>0) real root");
  const u0 = future.reduce((best, r) => (Math.abs(r) > Math.abs(best) ? r : best));
  u[0] = u0;
  u[3] = omega * u0;
  return exact(u);
}
