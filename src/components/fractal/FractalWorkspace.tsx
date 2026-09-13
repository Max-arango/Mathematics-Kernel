import { useCallback, useState } from "react";
import { FractalCanvas, type Stats } from "../FractalCanvas.tsx";
import { CanvasControls } from "../CanvasControls.tsx";
import { FractalToolbar } from "./FractalToolbar.tsx";
import { FractalPanel } from "./FractalPanel.tsx";
import { CanvasHud } from "./CanvasHud.tsx";
import { useStore } from "../../store.ts";
import { FRACTAL_BY_ID } from "../../fractals/registry.ts";

/**
 * The fractal workspace as a creative tool: a full-bleed GPU canvas with the
 * controls floating over it — a translucent panel, a top toolbar, a coordinate
 * HUD, and zoom controls.
 */
export function FractalWorkspace() {
  const [stats, setStats] = useState<Stats>({ fps: 0, ms: 0, width: 0, height: 0 });
  const [panelOpen, setPanelOpen] = useState(true);
  const onStats = useCallback(
    (s: Stats) => setStats((prev) => (s.ms < 0 ? { ...prev, fps: s.fps, width: s.width, height: s.height } : s)),
    [],
  );

  const pickMode = useStore((s) => s.pickMode);
  const canPick = useStore((s) => !FRACTAL_BY_ID[s.activeId].usesJuliaC);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <FractalCanvas onStats={onStats} />

      <FractalToolbar stats={stats} panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((o) => !o)} />

      {panelOpen && (
        <div className="absolute bottom-3 left-3 top-[68px] z-20 w-[300px]">
          <FractalPanel />
        </div>
      )}

      {pickMode && canPick && (
        <div className="mono-label pointer-events-none absolute left-1/2 top-[76px] z-20 -translate-x-1/2 rounded-full border border-vermilion-400/40 bg-vermilion-500/15 px-3 py-1 text-vermilion-100 backdrop-blur-md">
          ◎ click a point to spawn a Julia set
        </div>
      )}

      <CanvasHud />
      <CanvasControls />
    </div>
  );
}
