import { describe, it, expect } from "vitest";
import { makeSystem } from "../dynamics/system.ts";
import { InvalidInputError } from "../core/errors.ts";
import type { Vec3 } from "./types.ts";
import {
  evalMathField3D,
  curlField3D,
  stepMathTrajectory3D,
  traceMathTrajectory3D,
  sampleMathFieldGrid3D,
  sampleDivergenceGrid3D,
  sampleCurlGrid3D,
} from "./mathField.ts";

describe("evalMathField3D", () => {
  const circular = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);

  it("matches the known circular field (xy-rotation, z constant)", () => {
    expect(evalMathField3D(circular, [1, 0, 0])).toEqual([0, -1, 0]);
    const v = evalMathField3D(circular, [0, 1, 0]);
    expect(v[0]).toBe(1);
    expect(v[1]).toBeCloseTo(0, 10);
    expect(evalMathField3D(circular, [2, 3, 5])[2]).toBe(0);
  });

  it("throws on a non-3-variable system", () => {
    const sys2d = makeSystem(["x", "y"], ["y", "-x"]);
    expect(() => evalMathField3D(sys2d, [1, 0, 0] as unknown as Vec3)).toThrow(InvalidInputError);
  });
});

describe("curlField3D", () => {
  it("F=[y,-x,0] (rotation about z) has curl [0,0,-2]", () => {
    // Textbook check: curl = (∂z F_z/∂y − ∂F_y/∂z, ∂F_x/∂z − ∂F_z/∂x, ∂F_y/∂x − ∂F_x/∂y)
    // = (0−0, 0−0, −1−1) = (0,0,-2).
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    const c = curlField3D(sys, [3, 7, -2]);
    expect(c[0]).toBeCloseTo(0, 12);
    expect(c[1]).toBeCloseTo(0, 12);
    expect(c[2]).toBeCloseTo(-2, 12);
  });

  it("F=[x,y,z] (pure expansion) is irrotational: curl = [0,0,0]", () => {
    const sys = makeSystem(["x", "y", "z"], ["x", "y", "z"]);
    const c = curlField3D(sys, [1, 2, 3]);
    c.forEach((v) => expect(v).toBeCloseTo(0, 12));
  });

  it("throws on a non-3-variable system", () => {
    const sys2d = makeSystem(["x", "y"], ["y", "-x"]);
    expect(() => curlField3D(sys2d, [1, 0, 0] as unknown as Vec3)).toThrow(InvalidInputError);
  });
});

describe("stepMathTrajectory3D", () => {
  it("integrates a linear field to the analytically expected point (dx/dt=x, dy/dt=2y)", () => {
    const sys = makeSystem(["x", "y", "z"], ["x", "2*y", "0"]);
    const dt = 0.01;
    const { x1, t1 } = stepMathTrajectory3D(sys, [1, 1, 0], dt);
    expect(t1).toBeCloseTo(dt, 10);
    expect(x1[0]).toBeCloseTo(Math.exp(dt), 6);
    expect(x1[1]).toBeCloseTo(Math.exp(2 * dt), 6);
    expect(x1[2]).toBe(0);
  });

  it("dt<=0 is a no-op", () => {
    const sys = makeSystem(["x", "y", "z"], ["1", "1", "1"]);
    const { x1, t1 } = stepMathTrajectory3D(sys, [3, 4, 5], 0);
    expect(x1).toEqual([3, 4, 5]);
    expect(t1).toBe(0);
  });
});

describe("traceMathTrajectory3D", () => {
  it("conserves radius on the circular field (xy-plane rotation)", () => {
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    const { points, termination } = traceMathTrajectory3D(sys, [1, 0, 0], { dt: 0.01, maxSteps: 200 });
    expect(termination).toBe("max-steps");
    for (const p of points) {
      expect(Math.hypot(p[0], p[1])).toBeCloseTo(1, 2);
    }
  });

  it("terminates non-finite on division blow-up (dx/dt = 1/x)", () => {
    const sys = makeSystem(["x", "y", "z"], ["1/x", "0", "0"]);
    const { termination } = traceMathTrajectory3D(sys, [0, 0, 0], { dt: 0.1, maxSteps: 10 });
    expect(termination).toBe("non-finite");
  });

  it("terminates escaped once outside bounds", () => {
    const sys = makeSystem(["x", "y", "z"], ["10", "0", "0"]);
    const { termination, points } = traceMathTrajectory3D(sys, [0, 0, 0], {
      dt: 1, maxSteps: 50, bounds: { min: [-5, -5, -5], max: [5, 5, 5] },
    });
    expect(termination).toBe("escaped");
    expect(points.length).toBeLessThan(50);
  });
});

describe("sampleMathFieldGrid3D", () => {
  it("returns resolution^3 points and matching vectors", () => {
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    const { points, vectors } = sampleMathFieldGrid3D(
      sys, { min: [-1, -1, -1], max: [1, 1, 1] }, 3,
    );
    expect(points.length).toBe(27);
    expect(vectors.length).toBe(27);
    // sanity: vector at each point matches a direct eval
    expect(vectors[0]).toEqual(evalMathField3D(sys, points[0]));
  });

  it("rejects a non-positive-integer resolution", () => {
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    expect(() => sampleMathFieldGrid3D(sys, { min: [-1, -1, -1], max: [1, 1, 1] }, 0)).toThrow(InvalidInputError);
  });

  it("with no slice arg, output is byte-identical to the pre-slice behavior (regression)", () => {
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    const bounds = { min: [-1, -1, -1] as Vec3, max: [1, 1, 1] as Vec3 };
    const a = sampleMathFieldGrid3D(sys, bounds, 3);
    const b = sampleMathFieldGrid3D(sys, bounds, 3); // no 4th arg at all
    expect(a).toEqual(b);
    expect(a.points.length).toBe(27);
    // Exact expected point/vector for i=j=k=0 (x=-1,y=-1,z=-1): matches the
    // original hand-derived lerp, unaffected by the slice refactor.
    expect(a.points[0]).toEqual([-1, -1, -1]);
    expect(a.vectors[0]).toEqual(evalMathField3D(sys, [-1, -1, -1]));
  });

  it("with a slice, every returned point lies on the pinned plane", () => {
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    const bounds = { min: [-3, -3, -3] as Vec3, max: [3, 3, 3] as Vec3 };
    const { points } = sampleMathFieldGrid3D(sys, bounds, 4, { axis: "z", value: 2 });
    expect(points.length).toBe(16); // resolution² for a 2D plane, not resolution³
    for (const p of points) expect(p[2]).toBe(2);
  });
});

describe("sampleDivergenceGrid3D", () => {
  it("matches divergenceField per point (pure expansion F=[x,y,z] -> divergence 3 everywhere)", () => {
    const sys = makeSystem(["x", "y", "z"], ["x", "y", "z"]);
    const bounds = { min: [-1, -1, -1] as Vec3, max: [1, 1, 1] as Vec3 };
    const { points, values } = sampleDivergenceGrid3D(sys, bounds, 2);
    expect(points.length).toBe(8);
    for (const v of values) expect(v).toBeCloseTo(3, 12);
  });

  it("with a slice, every point lies on the pinned plane", () => {
    const sys = makeSystem(["x", "y", "z"], ["x", "y", "z"]);
    const bounds = { min: [-2, -2, -2] as Vec3, max: [2, 2, 2] as Vec3 };
    const { points } = sampleDivergenceGrid3D(sys, bounds, 3, { axis: "x", value: -1 });
    expect(points.length).toBe(9);
    for (const p of points) expect(p[0]).toBe(-1);
  });
});

describe("sampleCurlGrid3D", () => {
  it("matches curlField3D per point (rotation F=[y,-x,0] -> curl [0,0,-2] everywhere)", () => {
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    const bounds = { min: [-1, -1, -1] as Vec3, max: [1, 1, 1] as Vec3 };
    const { points, vectors } = sampleCurlGrid3D(sys, bounds, 2);
    expect(points.length).toBe(8);
    for (const v of vectors) {
      expect(v[0]).toBeCloseTo(0, 12);
      expect(v[1]).toBeCloseTo(0, 12);
      expect(v[2]).toBeCloseTo(-2, 12);
    }
  });

  it("with a slice, every point lies on the pinned plane", () => {
    const sys = makeSystem(["x", "y", "z"], ["y", "-x", "0"]);
    const bounds = { min: [-2, -2, -2] as Vec3, max: [2, 2, 2] as Vec3 };
    const { points } = sampleCurlGrid3D(sys, bounds, 3, { axis: "y", value: 0.5 });
    expect(points.length).toBe(9);
    for (const p of points) expect(p[1]).toBe(0.5);
  });
});
