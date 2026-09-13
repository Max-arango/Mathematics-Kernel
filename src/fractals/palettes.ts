// CSS previews of the GPU cosine palettes (Inigo Quilez: a + b·cos(2π(c·t+d))).
// Kept in lockstep with palette() in webgl/shaders.ts so the sidebar swatch a
// user picks matches the pixels they get. Index 5 (Grayscale) is the shader's
// `fract(t)` fallback — a plain black→white ramp.

interface Cos {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  d: [number, number, number];
}

const DEFS: (Cos | null)[] = [
  { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1, 1, 1], d: [0, 0.1, 0.2] }, // Classic
  { a: [0.5, 0.25, 0.05], b: [0.5, 0.35, 0.1], c: [1, 1, 0.7], d: [0, 0.15, 0.25] }, // Fire
  { a: [0.1, 0.3, 0.5], b: [0.2, 0.4, 0.5], c: [1, 1, 1], d: [0.6, 0.7, 0.9] }, // Ocean
  { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1, 1, 1], d: [0, 0.33, 0.67] }, // Rainbow
  { a: [0.5, 0, 0.5], b: [0.5, 0.4, 0.5], c: [1, 1, 0.5], d: [0.8, 0.9, 0.3] }, // Neon
  null, // Grayscale
];

const ch = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);

/** A CSS `linear-gradient(...)` string previewing palette `i` over t∈[0,1]. */
export function paletteGradient(i: number, stops = 12): string {
  const def = DEFS[i];
  const cols: string[] = [];
  for (let s = 0; s < stops; s++) {
    const t = s / (stops - 1);
    if (!def) {
      const g = ch(t);
      cols.push(`rgb(${g},${g},${g})`);
    } else {
      const rgb = [0, 1, 2].map((k) => ch(def.a[k] + def.b[k] * Math.cos(2 * Math.PI * (def.c[k] * t + def.d[k]))));
      cols.push(`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
    }
  }
  return `linear-gradient(to right, ${cols.join(",")})`;
}
