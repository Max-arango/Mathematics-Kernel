import { useStore } from "../store.ts";
import { FRACTAL_BY_ID } from "../fractals/registry.ts";

// Coordinates + iteration run in emulated double precision (df64, ~1e-13
// resolution for integer exponents). Below this span even df64 loses pixels.
// ponytail: df64 floor; lift further with perturbation-theory reference
// orbits (Phase 4). Fractional exponents still use the float32 path (~5e-5).
const PRECISION_FLOOR = 2e-12;

export function StatusBar() {
  const view = useStore((s) => s.view);
  const baseSpan = FRACTAL_BY_ID[useStore((s) => s.activeId)].view.span;
  const zoom = baseSpan / view.span;
  const lowPrecision = view.span < PRECISION_FLOOR;

  const fmt = (n: number) => (Math.abs(n) < 1e-3 || Math.abs(n) > 1e6 ? n.toExponential(6) : n.toFixed(9));

  return (
    <footer className="flex items-center gap-6 border-t border-line bg-void-soft px-4 py-1.5 text-graphite">
      <span className="mono-label text-graphite/70">Re <b className="ml-0.5 font-mono text-[11px] tabular-nums text-ink">{fmt(view.centerRe)}</b></span>
      <span className="mono-label text-graphite/70">Im <b className="ml-0.5 font-mono text-[11px] tabular-nums text-ink">{fmt(view.centerIm)}</b></span>
      <span className="mono-label text-graphite/70">Zoom <b className="ml-0.5 font-mono text-[11px] tabular-nums text-vermilion-300">{zoom < 1000 ? `${zoom.toFixed(2)}×` : `${zoom.toExponential(2)}×`}</b></span>
      <span className="mono-label text-graphite/70">Width <b className="ml-0.5 font-mono text-[11px] tabular-nums text-ink">{view.span.toExponential(3)}</b></span>
      {lowPrecision && (
        <span className="ml-auto rounded bg-amber-500/15 px-2 py-0.5 text-amber-300">
          ⚠ float32 precision limit — deep-zoom detail degraded
        </span>
      )}
    </footer>
  );
}
