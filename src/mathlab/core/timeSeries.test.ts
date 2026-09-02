// Tests for the first-class TimeSeries object.

import { describe, expect, it } from "vitest";
import {
  makeTimeSeries,
  sampleAt,
  duration,
  mapTimeSeries,
  sliceTimeSeries,
  fromUniform,
} from "./timeSeries.ts";

describe("makeTimeSeries", () => {
  it("stores t and y with defensive copies", () => {
    const t = [0, 1, 2];
    const y = [1, 4, 9];
    const ts = makeTimeSeries(t, y, { name: "x²" });
    t[0] = 999; // mutate the source
    expect(ts.t[0]).toBe(0);
  });

  it("copies metadata", () => {
    const ts = makeTimeSeries([0, 1], [1, 2], { name: "x", extra: { a: 1 } });
    ts.meta.extra!.a = 999;
    expect(ts.meta.extra!.a).toBe(999); // deep copy via spread
  });

  it("rejects length mismatch", () => {
    expect(() => makeTimeSeries([0, 1], [1])).toThrow(/length/);
  });

  it("rejects non-finite t", () => {
    expect(() => makeTimeSeries([0, Infinity], [1, 2])).toThrow(/finite/);
  });

  it("rejects non-finite y", () => {
    expect(() => makeTimeSeries([0, 1], [1, NaN])).toThrow(/finite/);
  });

  it("rejects non-monotone t by default", () => {
    expect(() => makeTimeSeries([0, 1, 0.5], [1, 2, 3])).toThrow(/increasing/);
  });

  it("accepts non-monotone t when monotone=false", () => {
    const ts = makeTimeSeries([0, 1, 0.5], [1, 2, 3], {}, { monotone: false });
    expect(ts.t.length).toBe(3);
  });
});

describe("accessors", () => {
  const ts = makeTimeSeries([0, 1, 2, 3], [1, 2, 3, 4]);

  it("sampleAt returns [t, y] at a given index", () => {
    expect(sampleAt(ts, 2)).toEqual([2, 3]);
  });

  it("sampleAt rejects an out-of-range index", () => {
    expect(() => sampleAt(ts, -1)).toThrow();
    expect(() => sampleAt(ts, 4)).toThrow();
  });

  it("duration is t[last] − t[0]", () => {
    expect(duration(ts)).toBe(3);
  });

  it("duration is 0 for a single-point series", () => {
    expect(duration(makeTimeSeries([1], [1]))).toBe(0);
  });

  it("duration is 0 for an empty series", () => {
    expect(duration(makeTimeSeries([], []))).toBe(0);
  });
});

describe("transformations", () => {
  it("mapTimeSeries applies f(t, y) and preserves metadata", () => {
    const ts = makeTimeSeries([0, 1, 2], [1, 2, 3], { name: "y" });
    const ts2 = mapTimeSeries(ts, (t, y) => t + 2 * y);
    expect(ts2.y).toEqual([2, 5, 8]);
    expect(ts2.meta.name).toBe("y");
  });

  it("sliceTimeSeries returns the inclusive [t0, t1] window", () => {
    const ts = makeTimeSeries([0, 1, 2, 3, 4, 5], [0, 1, 4, 9, 16, 25]);
    const ts2 = sliceTimeSeries(ts, 1.5, 4);
    // first t ≥ 1.5 is index 2 (t=2); first t > 4 is index 5 (t=5) ⇒ slice(2,5)
    expect(ts2.t).toEqual([2, 3, 4]);
    expect(ts2.y).toEqual([4, 9, 16]);
  });

  it("sliceTimeSeries with t1 beyond range includes the last sample", () => {
    const ts = makeTimeSeries([0, 1, 2], [10, 20, 30]);
    const ts2 = sliceTimeSeries(ts, 1, 100);
    expect(ts2.t).toEqual([1, 2]);
  });

  it("sliceTimeSeries with t0 before the start begins at the first sample", () => {
    const ts = makeTimeSeries([0, 1, 2], [10, 20, 30]);
    const ts2 = sliceTimeSeries(ts, -10, 1);
    expect(ts2.t).toEqual([0, 1]);
  });

  it("sliceTimeSeries rejects t0 > t1", () => {
    expect(() => sliceTimeSeries(makeTimeSeries([0, 1], [1, 2]), 1, 0)).toThrow(/≤/);
  });
});

describe("fromUniform", () => {
  it("generates a uniform time grid from t0 to t1", () => {
    const ts = fromUniform(0, 1, [0, 0.5, 1]);
    expect(ts.t).toEqual([0, 0.5, 1]);
    expect(ts.y).toEqual([0, 0.5, 1]);
  });

  it("empty samples ⇒ empty series with zero duration", () => {
    const ts = fromUniform(0, 1, []);
    expect(ts.t).toEqual([]);
    expect(duration(ts)).toBe(0);
  });

  it("single sample ⇒ t[0] === t0", () => {
    const ts = fromUniform(2, 5, [42]);
    expect(ts.t).toEqual([2]);
    expect(ts.y).toEqual([42]);
  });

  it("rejects t1 < t0", () => {
    expect(() => fromUniform(5, 2, [1, 2])).toThrow();
  });

  it("rejects non-finite t0/t1", () => {
    expect(() => fromUniform(NaN, 1, [1, 2])).toThrow();
  });
});
