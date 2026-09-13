import { useStore } from "../store.ts";
import { FRACTAL_BY_ID } from "../fractals/registry.ts";

/**
 * Floating, tool-style controls over the fractal canvas: zoom in/out and reset
 * view, plus a contextual usage hint. Zooming is centered (fx=fy=0.5), so the
 * aspect argument is irrelevant and passed as 1.
 */
export function CanvasControls() {
  const zoomAt = useStore((s) => s.zoomAt);
  const resetView = useStore((s) => s.resetView);
  const pickMode = useStore((s) => s.pickMode);
  const usesC = useStore((s) => FRACTAL_BY_ID[s.activeId].usesJuliaC);

  const btn =
    "flex size-9 items-center justify-center rounded-lg border border-line bg-void-soft/80 text-[17px] leading-none text-ink shadow-sm backdrop-blur-md transition hover:border-vermilion-400/50 hover:text-vermilion-200 focusable";
  const hint = pickMode && !usesC ? "click a point to spawn a Julia set" : "scroll to zoom · drag to pan";

  return (
    <>
      <div className="mono-label pointer-events-none absolute bottom-4 left-4 rounded-md border border-line bg-void-soft/70 px-2.5 py-1 text-graphite/80 backdrop-blur-md">
        {hint}
      </div>
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button className={btn} title="Zoom in" aria-label="Zoom in" onClick={() => zoomAt(0.5, 0.5, 1, 1 / 1.3)}>
          +
        </button>
        <button className={btn} title="Zoom out" aria-label="Zoom out" onClick={() => zoomAt(0.5, 0.5, 1, 1.3)}>
          −
        </button>
        <button className={btn} title="Reset view" aria-label="Reset view" onClick={resetView}>
          ⟲
        </button>
      </div>
    </>
  );
}
