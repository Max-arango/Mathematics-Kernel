// Unified numerical-method registry (spec §49). The ODE method registry, the
// optimization registry, and ad-hoc lists (root solvers, integrators, …) were
// each their own little lookup. This module is the single self-describing
// catalog: every numerical method the platform ships declares its name, the
// family it belongs to (Root / Integrator / ODE / Optimizer / LinearSolver /
// MonteCarlo), what capabilities it needs, and what its result type looks like.
//
// The module is intentionally DESCRIPTIVE — adding a new method is one entry in
// NUMERICAL_METHODS plus the implementation in its domain module. A solver
// comparison UI (spec §50) reads this catalog to build its dropdown.

export type MethodFamily =
  | "RootSolver"
  | "Integrator"
  | "ODESolver"
  | "Optimizer"
  | "LinearSolver"
  | "MonteCarloMethod"
  | "DistributionSampler";

export interface NumericalMethodInfo {
  name: string;
  family: MethodFamily;
  description: string;
  /** What inputs/derivatives the method needs from its caller. */
  needs: string[];
  /** What the result looks like (just a structural label — the real shape lives in the domain). */
  resultShape: string;
  /** Honest limitations the caller must respect. */
  limitations: string[];
}

/**
 * The full catalog of numerical methods registered with the platform. Each
 * entry is the metadata a UI needs to render a method picker / comparison
 * without inspecting the underlying modules. The map keys mirror the
 * per-domain registries (ODE_METHODS, OPT_METHODS, …) where they exist.
 */
export const NUMERICAL_METHODS: Record<string, NumericalMethodInfo> = {
  // ── Root solvers ─────────────────────────────────────────────────────────────
  "bisection": {
    name: "bisection",
    family: "RootSolver",
    description: "Bracket-and-halve root finder for a continuous function f over [a,b] with f(a)·f(b) < 0. Order 1, O(log ε) iterations.",
    needs: ["continuous f", "bracket [a,b] with sign change"],
    resultShape: "{ root, iterations, bracket }",
    limitations: ["requires a sign change", "single-root only", "does not generalize to systems"],
  },
  "newton-1d": {
    name: "newton-1d",
    family: "RootSolver",
    description: "Newton iteration x_{n+1} = x_n − f(x_n)/f'(x_n) on ℝ. Quadratic convergence near a simple root.",
    needs: ["f and f'"],
    resultShape: "{ root, iterations }",
    limitations: ["needs a derivative", "can diverge or cycle away from a root", "single-root only"],
  },

  // ── Integrators ──────────────────────────────────────────────────────────────
  "simpson": {
    name: "simpson",
    family: "Integrator",
    description: "Composite Simpson's rule for ∫_a^b f dx on an even subdivision. Order 4.",
    needs: ["f over [a,b]"],
    resultShape: "{ value, error, n }",
    limitations: ["needs even n", "smoothness assumed"],
  },
  "adaptive-integrate": {
    name: "adaptive-integrate",
    family: "Integrator",
    description: "Adaptive Simpson on a recursive interval subdivision; meets an absolute tolerance.",
    needs: ["f over [a,b]", "absTol"],
    resultShape: "{ value, error, evals }",
    limitations: ["adaptive error is an estimate"],
  },

  // ── ODE solvers ──────────────────────────────────────────────────────────────
  "euler": { name: "euler", family: "ODESolver", description: "Explicit (forward) Euler. Order 1, 1 f-eval/step.", needs: ["f(t,y)"], resultShape: "ODEResult", limitations: ["conditionally stable", "O(h) global error"] },
  "heun": { name: "heun", family: "ODESolver", description: "Heun (explicit trapezoid). Order 2, 2 f-evals/step.", needs: ["f(t,y)"], resultShape: "ODEResult", limitations: ["explicit, non-stiff"] },
  "rk2": { name: "rk2", family: "ODESolver", description: "Explicit midpoint. Order 2, 2 f-evals/step.", needs: ["f(t,y)"], resultShape: "ODEResult", limitations: ["explicit, non-stiff"] },
  "rk4": { name: "rk4", family: "ODESolver", description: "Classic Runge–Kutta. Order 4, 4 f-evals/step.", needs: ["f(t,y)"], resultShape: "ODEResult", limitations: ["explicit, non-stiff", "no error estimate"] },
  "rkf45": { name: "rkf45", family: "ODESolver", description: "Adaptive Runge–Kutta–Fehlberg 4(5) with step-size control and local extrapolation. Order 5.", needs: ["f(t,y)", "absTol", "relTol"], resultShape: "ODEResult (with accepted/rejected/errorEstimate)", limitations: ["explicit, non-stiff", "error estimate is heuristic"] },

  // ── Optimizers ───────────────────────────────────────────────────────────────
  "golden-section": {
    name: "golden-section",
    family: "Optimizer",
    description: "Derivative-free univariate minimization on a bracket; unimodal f assumed. LOCAL minimum.",
    needs: ["f", "bracket [a,b]"],
    resultShape: "{ x, f(x), iterations }",
    limitations: ["univariate", "local", "unimodal bracket"],
  },
  "gradient-descent": {
    name: "gradient-descent",
    family: "Optimizer",
    description: "Steepest descent with backtracking (Armijo) line search. LOCAL minimum.",
    needs: ["f", "∇f", "x0"],
    resultShape: "{ x, f(x), iterations, trajectory }",
    limitations: ["local", "may stall on ill-conditioned problems"],
  },
  "newton-opt": {
    name: "newton-opt",
    family: "Optimizer",
    description: "Damped line-searched Newton; H·d = −∇f each step. LOCAL minimum.",
    needs: ["f", "∇f", "H", "x0"],
    resultShape: "{ x, f(x), iterations, trajectory }",
    limitations: ["local", "needs Hessian", "Hessian must be (eventually) PD"],
  },

  // ── Linear solvers ───────────────────────────────────────────────────────────
  "lu-solve": {
    name: "lu-solve",
    family: "LinearSolver",
    description: "LU decomposition with partial pivoting for Ax = b.",
    needs: ["A (square)", "b"],
    resultShape: "{ x, pivot sign }",
    limitations: ["square only", "singular ⇒ no solution"],
  },
  "qr-least-squares": {
    name: "qr-least-squares",
    family: "LinearSolver",
    description: "Householder QR + back-substitution for the least-squares problem min ‖Ax − b‖₂.",
    needs: ["A (m ≥ n)", "b"],
    resultShape: "{ x, residual, ‖r‖₂, rank }",
    limitations: ["over-determined / full-rank"],
  },
  "svd-least-squares": {
    name: "svd-least-squares",
    family: "LinearSolver",
    description: "SVD-based least squares: numerically stable, handles rank-deficient A.",
    needs: ["A", "b"],
    resultShape: "{ x, residual, ‖r‖₂, rank, singular values }",
    limitations: ["slower than QR", "O(mn²)"],
  },
  "cholesky-solve": {
    name: "cholesky-solve",
    family: "LinearSolver",
    description: "Cholesky factorization A = L·Lᵀ for SPD systems.",
    needs: ["A (SPD)"],
    resultShape: "{ L }",
    limitations: ["A must be symmetric positive-definite"],
  },

  // ── Monte Carlo / sampling ───────────────────────────────────────────────────
  "monte-carlo": {
    name: "monte-carlo",
    family: "MonteCarloMethod",
    description: "Generic Monte Carlo estimator: average over N seeded samples with standard error.",
    needs: ["sampler", "N", "seed"],
    resultShape: "{ estimate, stderr, N, seed }",
    limitations: ["estimate is asymptotic; error is statistical, not exact"],
  },
};

/** Look up a method descriptor by name. Returns undefined when unknown (callers can fall back). */
export function numericalMethod(name: string): NumericalMethodInfo | undefined {
  return NUMERICAL_METHODS[name];
}

/** Every method in a given family, in insertion order. */
export function methodsByFamily(family: MethodFamily): NumericalMethodInfo[] {
  return Object.values(NUMERICAL_METHODS).filter((m) => m.family === family);
}

/** Family names actually present in the catalog. */
export function registeredFamilies(): MethodFamily[] {
  const set = new Set<MethodFamily>();
  for (const m of Object.values(NUMERICAL_METHODS)) set.add(m.family);
  return [...set];
}
