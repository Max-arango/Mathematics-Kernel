import { describe, expect, it } from "vitest";
import { evalMetric } from "./metric.ts";
import { integrateGeodesic } from "./geodesic.ts";
import { minkowski } from "./models/minkowski.ts";
import { makeSchwarzschild } from "./models/schwarzschild.ts";
import { makeKerr } from "./models/kerr.ts";
import { zamoAngularVelocity, zamoInitialVelocity } from "./frameDragging.ts";

describe("zamoAngularVelocity", () => {
  it("is exactly 0 for Minkowski (g_tphi=0 identically, no spin, no frame dragging)", () => {
    const res = zamoAngularVelocity(minkowski, [0, 1, 1, 1]);
    expect(res.kind).toBe("exact");
    if (res.kind !== "exact") return;
    expect(res.value).toBeCloseTo(0, 15);
  });

  it("is exactly 0 for Schwarzschild at any M, any point with g_phiphi!=0 (g_tphi=0 identically)", () => {
    for (const M of [0.5, 1, 3]) {
      for (const r of [5, 10, 50]) {
        const model = makeSchwarzschild(M);
        const res = zamoAngularVelocity(model, [0, r, Math.PI / 2, 0]);
        expect(res.kind).toBe("exact");
        if (res.kind !== "exact") continue;
        expect(res.value).toBeCloseTo(0, 15);
      }
    }
  });

  it("matches the far-field Lense-Thirring limit omega ~= 2*M*a/r^3 for Kerr", () => {
    const M = 1, a = 0.5, r = 100 * M;
    const model = makeKerr(M, a);
    const res = zamoAngularVelocity(model, [0, r, Math.PI / 2, 0]);
    expect(res.kind).toBe("exact");
    if (res.kind !== "exact") return;
    const approx = (2 * M * a) / (r * r * r);
    const relErr = Math.abs(res.value - approx) / Math.abs(approx);
    expect(relErr).toBeLessThan(1e-3);
  });
});

describe("zamoInitialVelocity", () => {
  it("Kerr: produces a norm-condition-satisfying, L=0 4-velocity", () => {
    const M = 1, a = 0.5;
    const model = makeKerr(M, a);
    const x0 = [0, 20 * M, Math.PI / 2, 0];
    const res = zamoInitialVelocity(model, x0);
    expect(res.kind).toBe("exact");
    if (res.kind !== "exact") return;
    const u = res.value;

    const g = evalMetric(model, x0);
    let norm = 0;
    for (let mu = 0; mu < 4; mu++) for (let nu = 0; nu < 4; nu++) norm += g[mu][nu] * u[mu] * u[nu];
    expect(norm).toBeCloseTo(-1, 9);

    const L = g[0][3] * u[0] + g[3][3] * u[3];
    expect(L).toBeCloseTo(0, 9);
  });
});

describe("frame dragging: an L=0 (ZAMO) Kerr geodesic still rotates", () => {
  it("keeps L~=0 across the whole trajectory while phi genuinely changes (dphi/dtau != 0)", () => {
    const M = 1, a = 0.5;
    const model = makeKerr(M, a);
    const r0 = 20 * M, theta0 = Math.PI / 2;
    const x0 = [0, r0, theta0, 0];

    const u0Res = zamoInitialVelocity(model, x0);
    expect(u0Res.kind).toBe("exact");
    if (u0Res.kind !== "exact") return;
    const u0 = u0Res.value;

    const result = integrateGeodesic(model, x0, u0, { tau0: 0, tau1: 50, h: 0.05 });
    expect(result.termination).toBe("completed");
    expect(result.states.length).toBeGreaterThan(100);

    const conserved = result.states.map((s) => {
      const gs = evalMetric(model, s.x);
      return gs[0][3] * s.u[0] + gs[3][3] * s.u[3]; // L along the trajectory
    });
    const L0 = conserved[0];
    for (const L of conserved) expect(L).toBeCloseTo(L0, 6);

    const phiStart = result.states[0].x[3];
    const phiEnd = result.states[result.states.length - 1].x[3];
    expect(Math.abs(phiEnd - phiStart)).toBeGreaterThan(1e-3);
    expect(result.states.some((s) => Math.abs(s.u[3]) > 1e-6)).toBe(true);
  });
});
