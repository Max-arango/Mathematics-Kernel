// Expanded dimension-algebra tests (spec §40/§41): exponent arithmetic, formatting,
// dimensional-consistency checks, and the multiplicative algebra of dimensions.

import { describe, it, expect } from "vitest";
import { dim, addDim, subDim, scaleDim, equalDim, isDimensionless, formatDim, DIMENSIONLESS, DIM_KEYS } from "./dimension.ts";

describe("dim construction", () => {
  it("unspecified base dimensions default to 0", () => {
    const d = dim({ length: 1 });
    expect(d.length).toBe(1);
    expect(d.mass).toBe(0);
    expect(d.time).toBe(0);
    expect(d.current).toBe(0);
    expect(d.temperature).toBe(0);
    expect(d.amount).toBe(0);
    expect(d.luminous).toBe(0);
  });

  it("DIMENSIONLESS is the zero vector", () => {
    expect(isDimensionless(DIMENSIONLESS)).toBe(true);
    expect(DIM_KEYS.every((k) => DIMENSIONLESS[k] === 0)).toBe(true);
  });

  it("isDimensionless only true for the zero vector", () => {
    expect(isDimensionless(dim({ length: 1 }))).toBe(false);
    expect(isDimensionless(dim({ time: -3 }))).toBe(false);
  });
});

describe("dimension arithmetic", () => {
  it("addDim componentwise", () => {
    const a = dim({ length: 1, time: -1 });
    const b = dim({ length: 1, time: -1 });
    expect(addDim(a, b)).toEqual(dim({ length: 2, time: -2 }));
  });

  it("subDim componentwise", () => {
    const a = dim({ length: 2 });
    const b = dim({ length: 1 });
    expect(subDim(a, b)).toEqual(dim({ length: 1 }));
  });

  it("scaleDim scales every base dimension", () => {
    const a = dim({ length: 1, time: -1 }); // velocity
    expect(scaleDim(a, 2)).toEqual(dim({ length: 2, time: -2 })); // velocity²
    expect(scaleDim(a, 0.5)).toEqual(dim({ length: 0.5, time: -0.5 }));
  });

  it("equalDim uses a tolerance", () => {
    expect(equalDim(dim({ length: 1 }), dim({ length: 1 + 1e-15 }))).toBe(true);
    expect(equalDim(dim({ length: 1 }), dim({ length: 1.0001 }))).toBe(false);
  });
});

describe("formatDim", () => {
  it("formats velocity L·T⁻¹ and the zero dimension as '1'", () => {
    expect(formatDim(dim({ length: 1, time: -1 }))).toBe("L·T⁻¹");
    expect(formatDim(DIMENSIONLESS)).toBe("1");
  });

  it("omits exponent 1", () => {
    expect(formatDim(dim({ mass: 1 }))).toBe("M");
  });

  it("handles negative exponents", () => {
    expect(formatDim(dim({ time: -2 }))).toBe("T⁻²");
  });

  it("orders base dimensions canonically (L, M, T, I, Θ, N, J)", () => {
    expect(formatDim(dim({ time: 1, length: 1 }))).toBe("L·T");
  });
});