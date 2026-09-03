import { emptyExperiment, type Experiment } from "./types.ts";

export interface Example { id: string; title: string; description: string; build: () => Experiment }

function make(title: string, description: string, cells: Experiment["cells"]): Experiment {
  const e = emptyExperiment(title);
  e.metadata.description = description;
  e.cells = cells;
  return e;
}

export const EXAMPLES: Example[] = [
  {
    id: "calculus",
    title: "Calculus — cubic",
    description: "Explore f(x) = x³ − 3x: derivative, critical points, extrema.",
    build: () => make("Calculus — cubic", "Explore f(x) = x³ − 3x.", [
      { id: "m0", kind: "markdown", source: "# Exploring a cubic\n\nWe study $f(x)=x^3-3x$ and its critical points." },
      { id: "e0", kind: "expression", name: "f", source: "x^3 - 3x" },
      { id: "a0", kind: "analysis", targetName: "f" },
      { id: "m1", kind: "markdown", source: "The critical points are the roots of $f'$." },
    ]),
  },
  {
    id: "multivariable",
    title: "Multivariable — paraboloid",
    description: "f(x,y) = x² + y²: gradient, Hessian, Laplacian.",
    build: () => make("Multivariable — paraboloid", "Gradient / Hessian / Laplacian of x²+y².", [
      { id: "m0", kind: "markdown", source: "# Paraboloid $f(x,y)=x^2+y^2$" },
      { id: "e0", kind: "expression", name: "f", source: "x^2 + y^2" },
      { id: "a0", kind: "analysis", targetName: "f" },
    ]),
  },
  {
    id: "gaussian",
    title: "Gaussian with a parameter",
    description: "f(x) = e^(−a·x²): change a and watch the analysis update.",
    build: () => make("Gaussian with a parameter", "Parameter-driven Gaussian.", [
      { id: "m0", kind: "markdown", source: "# Gaussian\n\n$f(x)=e^{-a x^2}$ — drag $a$ and the analysis recomputes." },
      { id: "p0", kind: "parameter", name: "a", value: 1, min: 0.1, max: 5, step: 0.1 },
      { id: "e0", kind: "expression", name: "f", source: "exp(-a*x^2)" },
      { id: "a0", kind: "analysis", targetName: "f" },
    ]),
  },
  // ─── Phase IV — Linear Algebra ────────────────────────────────────────────────────
  {
    id: "lin-2d-transform",
    title: "Linear Algebra — 2D linear transformation",
    description: "Grid deformation, basis vectors, eigenvectors of a 2×2 matrix.",
    build: () => make("2D Linear Transformation", "Visualize a 2×2 matrix as a linear map on the unit square/circle.",
      [
        { id: "m0", kind: "markdown", source: "# 2D Linear Transformation\n\nEvery 2×2 matrix $A = \\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$ acts on $\\mathbb{R}^2$ by $x \\mapsto Ax$. The determinant $\\det A = ad-bc$ gives the area scaling; the trace $a+d$ gives eigenvalue information. Explore the determinant as $a,b,c,d$ vary." },
        { id: "p0", kind: "parameter", name: "a", value: 2, min: -5, max: 5, step: 0.1 },
        { id: "p1", kind: "parameter", name: "d", value: 2, min: -5, max: 5, step: 0.1 },
        { id: "p2", kind: "parameter", name: "b", value: 1, min: -5, max: 5, step: 0.1 },
        { id: "p3", kind: "parameter", name: "c", value: 1, min: -5, max: 5, step: 0.1 },
        { id: "e0", kind: "expression", name: "detA", source: "a*d - b*c" },
        { id: "a0", kind: "analysis", targetName: "detA" },
      ]),
  },
  {
    id: "lin-svd",
    title: "Linear Algebra — SVD of a rectangular matrix",
    description: "Singular values, rank, U/Σ/V factors for an m×n matrix.",
    build: () => make("SVD of a 3×2 matrix", "U·Σ·Vᵀ decomposition with condition number.",
      [
        { id: "m0", kind: "markdown", source: "# Singular Value Decomposition\n\nFor any $m\\times n$ matrix $A$, the SVD gives $A = U\\Sigma V^{\\mathsf{T}}$ with orthogonal $U,V$ and diagonal $\\Sigma \\ge 0$. The singular values reveal rank and conditioning $\\kappa = \\sigma_{max}/\\sigma_{min}$." },
        { id: "e0", kind: "expression", name: "frobenius", source: "sqrt(1^2 + 2^2 + 3^2 + 4^2 + 5^2 + 6^2)" },
        { id: "a0", kind: "analysis", targetName: "frobenius" },
      ]),
  },
  {
    id: "lin-least-squares",
    title: "Linear Algebra — least squares regression",
    description: "Solve min ‖Ax − b‖₂ via QR/SVD for an overdetermined system.",
    build: () => make("Least Squares", "Overdetermined system → QR + back-substitution gives the minimum-norm solution.",
      [
        { id: "m0", kind: "markdown", source: "# Least Squares via QR\n\nGiven $A\\in\\mathbb{R}^{m\\times n}$ (with $m\\ge n$) and $b\\in\\mathbb{R}^m$, the problem $\\min_x \\|Ax-b\\|_2$ is solved by the normal equations $A^{\\mathsf{T}}Ax = A^{\\mathsf{T}}b$ or, more stably, by QR: $A = QR \\Rightarrow Rx = Q^{\\mathsf{T}}b$. For the model $y = mx + c$ the slope is $m = \\frac{n\\sum x_i y_i - \\sum x_i \\sum y_i}{n\\sum x_i^2 - (\\sum x_i)^2}$." },
        { id: "e0", kind: "expression", name: "slope", source: "(4*4 - 3)" },
        { id: "a0", kind: "analysis", targetName: "slope" },
      ]),
  },
  // ─── Phase IV — Optimization ──────────────────────────────────────────────────────
  {
    id: "opt-rosenbrock",
    title: "Optimization — Rosenbrock function",
    description: "The classic banana-shaped valley: gradient descent vs Newton.",
    build: () => make("Rosenbrock Optimization", "Compare gradient descent and Newton on the Rosenbrock banana function.",
      [
        { id: "m0", kind: "markdown", source: "# Rosenbrock Function\n\n$$f(x,y) = (1-x)^2 + 100(y-x^2)^2$$\n\nGlobal minimum at $(1,1)$. Gradient descent takes many small steps along the curved valley; Newton uses curvature and reaches the minimum in fewer iterations." },
        { id: "e0", kind: "expression", name: "rosen", source: "(1-x)^2 + 100*(y-x^2)^2" },
        { id: "a0", kind: "analysis", targetName: "rosen" },
        { id: "m1", kind: "markdown", source: "The Inspector shows critical points, Hessian eigenvalues, and classification (local minimum at (1,1))." },
      ]),
  },
  {
    id: "opt-quadratic",
    title: "Optimization — quadratic bowl",
    description: "Simple positive-definite quadratic: exact Newton step in one iteration.",
    build: () => make("Quadratic Bowl", "A well-conditioned quadratic where Newton converges in one step.",
      [
        { id: "m0", kind: "markdown", source: "# Quadratic Bowl\n\n$$f(x,y) = x^2 + 2y^2 - 2x + 4y$$\n\nHessian is constant and PD, so Newton's method finds the exact minimum in a single step regardless of the starting point." },
        { id: "e0", kind: "expression", name: "quad", source: "x^2 + 2*y^2 - 2*x + 4*y" },
        { id: "a0", kind: "analysis", targetName: "quad" },
      ]),
  },
  // ─── Phase IV — Dynamical Systems ─────────────────────────────────────────────────
  {
    id: "dyn-harmonic",
    title: "Dynamical Systems — harmonic oscillator",
    description: "x' = y, y' = -x: center equilibrium, periodic orbits.",
    build: () => make("Harmonic Oscillator", "Continuous 2D flow with a center equilibrium at the origin.",
      [
        { id: "m0", kind: "markdown", source: "# Harmonic Oscillator\n\n$$\n\\begin{cases}\n\\dot{x} = y \\\\\n\\dot{y} = -x\n\\end{cases}\n$$\nEquilibrium at $(0,0)$. Jacobian $\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}$ has eigenvalues $\\pm i$ ⇒ linear center. First component of the vector field is $\\dot{x} = y$." },
        { id: "e0", kind: "expression", name: "dxdt", source: "y" },
        { id: "a0", kind: "analysis", targetName: "dxdt" },
      ]),
  },
  {
    id: "dyn-lorenz",
    title: "Dynamical Systems — Lorenz system (chaos)",
    description: "The famous chaotic attractor: equilibria, stability, strange attractor.",
    build: () => make("Lorenz Attractor", "3D chaotic flow with a strange attractor and sensitive dependence.",
      [
        { id: "m0", kind: "markdown", source: "# Lorenz System\n\n$$\n\\begin{cases}\n\\dot{x} = \\sigma(y-x) \\\\\n\\dot{y} = x(\\rho-z)-y \\\\\n\\dot{z} = xy - \\beta z\n\\end{cases}\n$$\nClassic parameters: $\\sigma=10, \\rho=28, \\beta=8/3$. Explore the first component $\\dot{x} = \\sigma(y-x)$ as $\\sigma$ varies." },
        { id: "p0", kind: "parameter", name: "sigma", value: 10, min: 0.1, max: 50, step: 0.1 },
        { id: "p1", kind: "parameter", name: "rho", value: 28, min: 1, max: 100, step: 0.1 },
        { id: "p2", kind: "parameter", name: "beta", value: 2.6666666666666665, min: 0.1, max: 10, step: 0.01 },
        { id: "e0", kind: "expression", name: "xdot", source: "sigma*(y-x)" },
        { id: "a0", kind: "analysis", targetName: "xdot" },
      ]),
  },
  // ─── Phase IV — ODEs ──────────────────────────────────────────────────────────────
  {
    id: "ode-logistic",
    title: "ODE — logistic growth",
    description: "x' = r·x(1-x/K): S-shaped growth, stable equilibrium at K.",
    build: () => make("Logistic Growth ODE", "Scalar autonomous ODE with RK4 and parameter sweep.",
      [
        { id: "m0", kind: "markdown", source: "# Logistic Growth\n\n$$\\frac{dx}{dt} = r\\,x\\left(1-\\frac{x}{K}\\right)$$\nEquilibria: $x=0$ (unstable) and $x=K$ (stable). RK4 integration with $r=1.5, K=10$." },
        { id: "p0", kind: "parameter", name: "r", value: 1.5, min: 0.1, max: 5, step: 0.1 },
        { id: "p1", kind: "parameter", name: "K", value: 10, min: 1, max: 50, step: 1 },
        { id: "e0", kind: "expression", name: "logistic", source: "r*x*(1-x/K)" },
        { id: "a0", kind: "analysis", targetName: "logistic" },
      ]),
  },
  {
    id: "ode-harmonic",
    title: "ODE — harmonic oscillator (system)",
    description: "2D system x' = v, v' = -x: compare Euler vs RK4 energy conservation.",
    build: () => make("Harmonic Oscillator ODE", "Compare fixed-step Euler and RK4 on energy conservation.",
      [
        { id: "m0", kind: "markdown", source: "# Harmonic Oscillator as an IVP\n\n$$\n\\begin{cases}\n\\dot{x} = v \\\\\n\\dot{v} = -x\n\\end{cases}\n$$\nEnergy $E = x^2 + v^2$ is conserved. Euler spirals outward (energy grows); RK4 preserves energy over long intervals." },
        { id: "e0", kind: "expression", name: "energy", source: "x^2 + v^2" },
        { id: "a0", kind: "analysis", targetName: "energy" },
      ]),
  },
  // ─── Phase IV — PDEs ──────────────────────────────────────────────────────────────
  {
    id: "pde-heat1d",
    title: "PDE — 1D heat equation",
    description: "u_t = α·u_xx: diffusion from a Gaussian initial condition.",
    build: () => make("1D Heat Equation", "Explicit finite-difference solution of the heat equation.",
      [
        { id: "m0", kind: "markdown", source: "# 1D Heat Equation\n\n$$u_t = \\alpha u_{xx}, \\quad u(x,0) = e^{-x^2}$$\nExplicit FTCS scheme: stable for $\\Delta t \\le \\frac{\\Delta x^2}{2\\alpha}$. Gaussian spreads and flattens over time." },
        { id: "e0", kind: "expression", name: "init", source: "exp(-x^2)" },
        { id: "a0", kind: "analysis", targetName: "init" },
      ]),
  },
  // ─── Phase IV — Probability / Statistics ──────────────────────────────────────────
  {
    id: "prob-normal",
    title: "Probability — Normal distribution + Monte Carlo π",
    description: "PDF/CDF/sampling, Monte Carlo integration for π estimation.",
    build: () => make("Normal Distribution + Monte Carlo π", "Distribution parameters, seeded samples, and a π estimate.",
      [
        { id: "m0", kind: "markdown", source: "# Normal Distribution\n\n$X \\sim \\mathcal{N}(0,1)$. The Inspector shows mean, variance, PMF/PDF, CDF, and a seeded sample preview. Monte Carlo estimates $\\pi$ by sampling the unit square." },
        { id: "e0", kind: "expression", name: "gaussian", source: "exp(-x^2/2)/sqrt(2*pi)" },
        { id: "a0", kind: "analysis", targetName: "gaussian" },
      ]),
  },
  {
    id: "stat-regression",
    title: "Statistics — linear & polynomial regression",
    description: "Least-squares fit of y = a + b·x and y = a + b·x + c·x².",
    build: () => make("Linear Regression", "Dataset of points → linear and quadratic least-squares.",
      [
        { id: "m0", kind: "markdown", source: "# Linear Regression\n\nGiven data $\\{(x_i, y_i)\\}$, find $a,b$ minimizing $\\sum (y_i - a - b x_i)^2$. The normal equations solve this exactly. For the line through $(0,1),(1,3),(2,5)$ the fit is $y = 2x+1$." },
        { id: "e0", kind: "expression", name: "fit", source: "2*x + 1" },
        { id: "a0", kind: "analysis", targetName: "fit" },
      ]),
  },
  // ─── Phase IV — Number Theory ─────────────────────────────────────────────────────
  {
    id: "num-collatz",
    title: "Number Theory — Collatz sequences",
    description: "Explore the 3n+1 conjecture: stopping times, max values, cycles.",
    build: () => make("Collatz Exploration", "Iterate n → n/2 (even) or 3n+1 (odd) from many seeds.",
      [
        { id: "m0", kind: "markdown", source: "# Collatz Conjecture\n\n$$T(n) = \\begin{cases}n/2 & n \\text{ even} \\\\ 3n+1 & n \\text{ odd}\\end{cases}$$\nThe conjecture: every positive integer eventually reaches the cycle 4→2→1. The engine exposes this via the `mod` function; the Inspector explores its structure." },
        { id: "e0", kind: "expression", name: "collatz", source: "mod(3*n + 1, 2*n)" },
        { id: "a0", kind: "analysis", targetName: "collatz" },
      ]),
  },
  // ─── Phase IV — Complex Analysis ──────────────────────────────────────────────────
  {
    id: "complex-z2",
    title: "Complex Analysis — conformal map z²",
    description: "Grid mapping, domain coloring, zeros/poles of z².",
    build: () => make("z² Conformal Map", "Visualize f(z)=z²: angle doubling, circle → circle.",
      [
        { id: "m0", kind: "markdown", source: "# Complex Map $f(z)=z^2$\n\nWriting $z=r e^{i\\theta}$, $z^2 = r^2 e^{i2\\theta}$. Magnitude squares, argument doubles. Rectangular grid becomes curved grid; right angles are preserved (conformal except at 0)." },
        { id: "e0", kind: "expression", name: "z2", source: "z^2" },
        { id: "a0", kind: "analysis", targetName: "z2" },
      ]),
  },
  {
    id: "complex-inverse",
    title: "Complex Analysis — 1/z and branch cuts",
    description: "Inversion, pole at 0, exterior ↔ interior mapping.",
    build: () => make("Inversion 1/z", "Conformal map $z \\mapsto 1/z$: unit circle ↔ unit circle, inside ↔ outside.",
      [
        { id: "m0", kind: "markdown", source: "# Inversion $f(z)=1/z$\n\nPole at 0, zero at ∞. The map is an involution: $f(f(z))=z$. Circles/lines through 0 become lines; circles/lines not through 0 become circles." },
        { id: "e0", kind: "expression", name: "inv", source: "1/z" },
        { id: "a0", kind: "analysis", targetName: "inv" },
      ]),
  },
  // ─── Phase IV — Scientific Units ──────────────────────────────────────────────────
  {
    id: "units-kinematics",
    title: "Scientific Computing — kinematics with units",
    description: "Distance, time, velocity with dimensional consistency checks.",
    build: () => make("Kinematics with Units", "Unit-aware calculation: distance, time, velocity = distance/time.",
      [
        { id: "m0", kind: "markdown", source: "# Units & Dimensional Analysis\n\nDistance = 100 m, time = 9.58 s → velocity = distance/time = 10.44 m/s. The unit system catches `m + s` as a dimension mismatch." },
        { id: "e0", kind: "expression", name: "velocity", source: "100/9.58" },
        { id: "a0", kind: "analysis", targetName: "velocity" },
      ]),
  },
];
