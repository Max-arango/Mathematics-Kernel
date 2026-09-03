// Tests for the mathematical search index (spec §77).

import { describe, it, expect } from "vitest";
import { searchMath, searchGrouped, SEARCH_INDEX, type SearchEntry } from "./mathSearch.ts";

describe("searchMath", () => {
  it("finds the eigenvalue doc for 'eigenvalue'", () => {
    const hits = searchMath("eigenvalue");
    expect(hits.some((h) => h.route === "linear-algebra")).toBe(true);
  });

  it("finds the Lorenz example for 'Lorenz' (case-insensitive)", () => {
    const hits = searchMath("LORENZ");
    expect(hits.some((h) => h.route === "dyn-lorenz")).toBe(true);
    expect(hits.some((h) => h.route === "dynamical-systems")).toBe(true);
  });

  it("'RK4' routes to the ODE doc and odeSolve capability", () => {
    const hits = searchMath("RK4");
    const routes = hits.map((h) => h.route);
    expect(routes).toContain("odes");
    expect(routes).toContain("odeSolve");
  });

  it("'normal distribution' routes to probability docs and example", () => {
    const hits = searchMath("normal distribution");
    expect(hits.some((h) => h.route === "probability-statistics")).toBe(true);
    expect(hits.some((h) => h.route === "prob-normal")).toBe(true);
  });

  it("'Euler characteristic' routes to topology", () => {
    const hits = searchMath("euler characteristic");
    expect(hits.some((h) => h.route === "topo")).toBe(true);
  });

  it("'factorize' routes to number theory docs", () => {
    expect(searchMath("factorize").some((h) => h.route === "number-theory")).toBe(true);
  });

  it("empty query returns no results", () => {
    expect(searchMath("")).toEqual([]);
    expect(searchMath("   ")).toEqual([]);
  });

  it("multi-token query narrows: all tokens must match", () => {
    // "lorenz rosenbrock" should match nothing (no single entry has both)
    expect(searchMath("lorenz rosenbrock")).toEqual([]);
  });

  it("returns [] for a nonsense query", () => {
    expect(searchMath("zzzznotarealthing")).toEqual([]);
  });
});

describe("searchGrouped", () => {
  it("groups hits by kind", () => {
    const g = searchGrouped("matrix");
    expect(g.doc.some((h) => h.route === "linear-algebra")).toBe(true);
    expect(g.example.some((h) => h.route === "lin-svd")).toBe(true);
    expect(Array.isArray(g.workspace)).toBe(true);
    expect(Array.isArray(g.capability)).toBe(true);
  });

  it("always returns all four groups (possibly empty)", () => {
    const g = searchGrouped("nothing-here");
    expect(Object.keys(g).sort()).toEqual(["capability", "doc", "example", "workspace"]);
  });
});

describe("index integrity", () => {
  it("every entry has a unique id", () => {
    const ids = SEARCH_INDEX.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has a non-empty title, route, and keyword list", () => {
    for (const e of SEARCH_INDEX) {
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.route.length).toBeGreaterThan(0);
      expect(e.keywords.length).toBeGreaterThan(0);
    }
  });

  it("no entry has an empty-string keyword", () => {
    for (const e of SEARCH_INDEX) {
      for (const k of e.keywords) expect(k.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers all four target kinds", () => {
    const kinds = new Set<SearchEntry["kind"]>(SEARCH_INDEX.map((e) => e.kind));
    for (const k of ["workspace", "doc", "capability", "example"] as const) {
      expect(kinds.has(k)).toBe(true);
    }
  });
});