import { useStore } from "../../store.ts";
import { FRACTAL_BY_ID } from "../../fractals/registry.ts";

// Below this span even emulated double precision (df64, ~1e-13) loses pixels.
const PRECISION_FLOOR = 2e-12;

/** Floating coordinate/zoom readout, centered at the bottom of the canvas. */
export function CanvasHud() {
  const view = useStore((s) => s.view);
  const baseSpan = FRACTAL_BY_ID[useStore((s) => s.activeId)].view.span;
  const zoom = baseSpan / view.span;
  const lowPrecision = view.span < PRECISION_FLOOR;

  const fmt = (n: number) => (Math.abs(n) < 1e-3 || Math.abs(n) > 1e6 ? n.toExponential(6) : n.toFixed(9));
  const Stat = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
    <span className="mono-label text-graphite/70">
      {k}
      <b className={`ml-1 font-mono text-[11px] tabular-nums ${accent ? "text-vermilion-300" : "text-ink"}`}>{v}</b>
    </span>
  );

  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-line bg-void-soft/70 px-3.5 py-1.5 shadow-lg backdrop-blur-md">
      <Stat k="Re" v={fmt(view.centerRe)} />
      <Stat k="Im" v={fmt(view.centerIm)} />
      <Stat k="Zoom" v={zoom < 1000 ? `${zoom.toFixed(2)}×` : `${zoom.toExponential(2)}×`} accent />
      <Stat k="Width" v={view.span.toExponential(3)} />
      {lowPrecision && (
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">⚠ float32 precision limit</span>
      )}
    </div>
  );
}
