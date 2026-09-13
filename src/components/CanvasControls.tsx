import { useStore } from "../store.ts";

/**
 * Floating zoom controls over the fractal canvas. Zooming is centered
 * (fx=fy=0.5), so the aspect argument is irrelevant and passed as 1.
 */
export function CanvasControls() {
  const zoomAt = useStore((s) => s.zoomAt);
  const resetView = useStore((s) => s.resetView);

  const btn =
    "flex size-9 items-center justify-center rounded-lg border border-line bg-void-soft/80 text-[17px] leading-none text-ink shadow-lg backdrop-blur-md transition hover:border-vermilion-400/50 hover:text-vermilion-200 focusable";

  return (
    <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
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
  );
}
