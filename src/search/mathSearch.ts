// Lightweight mathematical search index (spec §77). A structured, static index
// that maps human-typed terms ("gradient", "eigenvalue", "Lorenz", "RK4",
// "normal distribution", "Euler characteristic", "factorize") to the things a
// user can open: a workspace, a documentation section, an Inspector capability,
// or a bundled example experiment. Not semantic AI search — a curated index.
//
// The index is intentionally data-only, so it is serializable, testable, and
// trivially extended when a new domain ships. Search is case-insensitive
// substring-of-word matching against the curated keyword lists.

export type SearchTargetKind = "workspace" | "doc" | "capability" | "example";

export interface SearchEntry {
  id: string;              // stable identifier for the target
  kind: SearchTargetKind;
  title: string;           // human-readable label
  keywords: string[];      // terms this entry should match
  /** Where to navigate: workspace name, doc section id, capability name, or example id. */
  route: string;
}

export const SEARCH_INDEX: SearchEntry[] = [
  // ── Workspaces ───────────────────────────────────────────────────────────────
  { id: "ws-calc", kind: "workspace", title: "Calculator", keywords: ["graph", "plot", "2d", "3d", "function", "derivative", "integral", "surface"], route: "calculator" },
  { id: "ws-fractal", kind: "workspace", title: "Fractal Lab", keywords: ["fractal", "mandelbrot", "julia", "chaos", "escape", "zoom"], route: "fractal" },
  { id: "ws-bloch", kind: "workspace", title: "Bloch Sphere", keywords: ["quantum", "qubit", "bloch", "gate", "pulse", "unitary", "spin"], route: "bloch" },
  { id: "ws-fourd", kind: "workspace", title: "4D", keywords: ["4d", "fourd", "polytope", "tesseract", "hypercube", "hoph", "clifford"], route: "fourd" },
  { id: "ws-topo", kind: "workspace", title: "Topology", keywords: ["topology", "homeomorphism", "genus", "euler characteristic", "manifold", "surface", "morph"], route: "topo" },
  { id: "ws-dynamics3d", kind: "workspace", title: "Dynamics 3D", keywords: ["dynamics 3d", "gravity", "n-body", "mathematical field", "general relativity", "schwarzschild", "kerr", "black hole", "geodesic", "frame dragging"], route: "dynamics3d" },
  { id: "ws-inspector", kind: "workspace", title: "Inspector", keywords: ["inspect", "analyze", "properties", "invariants", "compare"], route: "inspector" },
  { id: "ws-notebook", kind: "workspace", title: "Notebook", keywords: ["experiment", "notebook", "reproducib", "cell", "serialize"], route: "notebook" },

  // ── Documentation sections (ids match content.ts) ───────────────────────────
  { id: "doc-linear", kind: "doc", title: "Linear Algebra", keywords: ["matrix", "vector", "eigenvalue", "eigenvector", "svd", "decomposition", "lu", "qr", "cholesky", "least squares", "determinant", "nullspace", "rank", "basis"], route: "linear-algebra" },
  { id: "doc-opt", kind: "doc", title: "Optimization", keywords: ["optimization", "gradient descent", "newton", "golden-section", "hessian", "critical point", "rosenbrock", "minimum"], route: "optimization" },
  { id: "doc-dyn", kind: "doc", title: "Dynamical Systems", keywords: ["dynamical", "equilibrium", "jacobian", "stability", "phase space", "nullcline", "bifurcation", "lyapunov", "lorenz", "attractor", "fixed point"], route: "dynamical-systems" },
  { id: "doc-dyn3d", kind: "doc", title: "Dynamics 3D", keywords: ["dynamics 3d", "gravity", "n-body", "newtonian", "mathematical field", "divergence", "curl", "general relativity", "minkowski", "schwarzschild", "kerr", "christoffel", "geodesic", "riemann", "ricci", "einstein tensor", "frame dragging", "zamo", "black hole", "softened", "gravitational strength", "spawn", "provenance"], route: "dynamics3d" },
  { id: "doc-ode", kind: "doc", title: "ODEs", keywords: ["ode", "rk4", "rkf45", "euler", "heun", "runge-kutta", "initial value", "ivp", "differential equation", "stiff", "convergence"], route: "odes" },
  { id: "doc-pde", kind: "doc", title: "PDEs", keywords: ["pde", "heat equation", "wave equation", "laplace", "poisson", "finite difference", "cfl", "diffusion"], route: "pdes" },
  { id: "doc-prob", kind: "doc", title: "Probability & Statistics", keywords: ["probability", "distribution", "normal", "binomial", "poisson", "pdf", "cdf", "statistics", "regression", "correlation", "monte carlo", "variance", "expected value"], route: "probability-statistics" },
  { id: "doc-nt", kind: "doc", title: "Number Theory", keywords: ["number theory", "prime", "gcd", "factorize", "factorization", "euler phi", "mobius", "collatz", "modular", "miller rabin", "lcm", "euclid"], route: "number-theory" },
  { id: "doc-complex", kind: "doc", title: "Complex Analysis", keywords: ["complex", "cauchy", "riemann", "holomorphic", "conformal", "domain coloring", "branch", "special function", "gamma", "erf"], route: "complex-analysis" },
  { id: "doc-sci", kind: "doc", title: "Scientific Computing", keywords: ["units", "dimensional", "uncertainty", "constant", "si", "conversion", "measurement"], route: "scientific-computing" },

  // ── Inspector capabilities ───────────────────────────────────────────────────
  { id: "cap-gradient", kind: "capability", title: "Gradient ∇f", keywords: ["gradient", "partial derivative", "nabla"], route: "gradient" },
  { id: "cap-hessian", kind: "capability", title: "Hessian", keywords: ["hessian", "second derivative", "curvature"], route: "hessian" },
  { id: "cap-eigen", kind: "capability", title: "Eigenstructure", keywords: ["eigen", "eigenvalue", "eigenvector", "spectrum", "diagonaliz"], route: "eigen" },
  { id: "cap-det", kind: "capability", title: "Determinant", keywords: ["determinant", "det"], route: "determinant" },
  { id: "cap-eq", kind: "capability", title: "Equilibria", keywords: ["equilibrium", "fixed point", "rest point"], route: "equilibria" },
  { id: "cap-stab", kind: "capability", title: "Stability", keywords: ["stability", "stable", "unstable", "saddle", "spiral", "center"], route: "stability" },
  { id: "cap-ode", kind: "capability", title: "ODE solve", keywords: ["ode", "solve", "integrate", "rk4", "rkf45"], route: "odeSolve" },
  { id: "cap-traj", kind: "capability", title: "Trajectory", keywords: ["trajectory", "orbit", "phase portrait"], route: "trajectory" },

  // ── Example experiments (ids match examples.ts) ──────────────────────────────
  { id: "exg-rosenbrock", kind: "example", title: "Optimization — Rosenbrock", keywords: ["rosenbrock", "banana", "gradient descent", "newton", "optimization"], route: "opt-rosenbrock" },
  { id: "exg-lorenz", kind: "example", title: "Dynamics — Lorenz attractor", keywords: ["lorenz", "chaos", "attractor", "butterfly"], route: "dyn-lorenz" },
  { id: "exg-harmonic", kind: "example", title: "Dynamics — harmonic oscillator", keywords: ["harmonic", "oscillator", "center", "periodic"], route: "dyn-harmonic" },
  { id: "exg-logistic", kind: "example", title: "ODE — logistic growth", keywords: ["logistic", "growth", "sigmoid", "carrying capacity"], route: "ode-logistic" },
  { id: "exg-heat", kind: "example", title: "PDE — 1D heat", keywords: ["heat", "diffusion", "pde"], route: "pde-heat1d" },
  { id: "exg-normal", kind: "example", title: "Probability — Normal + Monte Carlo π", keywords: ["normal", "monte carlo", "pi", "distribution"], route: "prob-normal" },
  { id: "exg-collatz", kind: "example", title: "Number Theory — Collatz", keywords: ["collatz", "3n+1", "hailstone"], route: "num-collatz" },
  { id: "exg-z2", kind: "example", title: "Complex — z²", keywords: ["complex", "conformal", "z squared"], route: "complex-z2" },
  { id: "exg-svd", kind: "example", title: "Linear Algebra — SVD", keywords: ["svd", "singular value", "matrix"], route: "lin-svd" },
];

/** Case-insensitive search: an entry matches if ANY keyword contains the query. */
export function searchMath(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Split into tokens; require all tokens to match (narrowing as you type more).
  const tokens = q.split(/\s+/).filter(Boolean);
  return SEARCH_INDEX.filter((entry) => {
    const hay = entry.keywords.join(" ").toLowerCase() + " " + entry.title.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

/** Every entry matching the query, grouped by kind (stable for rendering). */
export function searchGrouped(query: string): Record<SearchTargetKind, SearchEntry[]> {
  const hits = searchMath(query);
  const out: Record<SearchTargetKind, SearchEntry[]> = { workspace: [], doc: [], capability: [], example: [] };
  for (const e of hits) out[e.kind].push(e);
  return out;
}