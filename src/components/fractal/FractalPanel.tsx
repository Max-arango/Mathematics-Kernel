import { useStore, FRACTALS } from "../../store.ts";
import { FRACTAL_BY_ID } from "../../fractals/registry.ts";
import { Collapsible } from "./Collapsible.tsx";
import { ParamControl, ColorSlider, PaletteGrid } from "./controls.tsx";
import { AnimateControls } from "../AnimatePanel.tsx";
import { ExpressionControls } from "../ExpressionPanel.tsx";

const ic = "size-4";
const Icons = {
  shape: (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <path d="M4 16 C 8 16, 8 6, 12 6 S 16 18, 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fx: (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <path d="M14 5 C 10 5, 11 9, 10 12 C 9 16, 8 19, 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  params: (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="8" r="2.4" fill="currentColor" />
      <circle cx="15" cy="16" r="2.4" fill="currentColor" />
    </svg>
  ),
  color: (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <path d="M12 3 C 12 3, 5 11, 5 15 a7 7 0 0 0 14 0 C 19 11, 12 3, 12 3 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  animate: (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <path d="M8 5 L 19 12 L 8 19 Z" fill="currentColor" />
    </svg>
  ),
};

export function FractalPanel() {
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const resetParams = useStore((s) => s.resetParams);
  const pickMode = useStore((s) => s.pickMode);
  const setPickMode = useStore((s) => s.setPickMode);
  const colorScale = useStore((s) => s.colorScale);
  const colorOffset = useStore((s) => s.colorOffset);
  const invert = useStore((s) => s.invert);
  const setColor = useStore((s) => s.setColor);

  const active = FRACTAL_BY_ID[activeId];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-void-soft/85 shadow-2xl backdrop-blur-xl">
      <div className="scroll-thin flex-1 overflow-y-auto">
        <Collapsible title="Shape" icon={Icons.shape}>
          <div className="grid gap-0.5">
            {FRACTALS.map((f) => {
              const on = f.id === activeId;
              return (
                <button
                  key={f.id}
                  onClick={() => setActive(f.id)}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                    on ? "bg-vermilion-500/15 text-vermilion-100" : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
                  }`}
                >
                  <span aria-hidden className={`h-3.5 w-[3px] rounded-full transition ${on ? "bg-vermilion-400" : "bg-transparent"}`} />
                  {f.name}
                </button>
              );
            })}
          </div>
          {!active.usesJuliaC && (
            <button
              onClick={() => setPickMode(!pickMode)}
              className={`mt-2.5 w-full rounded-md px-3 py-1.5 text-xs font-medium transition ${
                pickMode
                  ? "bg-vermilion-500/20 text-vermilion-100 ring-1 ring-vermilion-400/50"
                  : "bg-white/5 text-stone-400 hover:text-stone-200"
              }`}
            >
              {pickMode ? "◎ Click the plane to spawn Julia…" : "⊹ Pick a Julia set from a point"}
            </button>
          )}
        </Collapsible>

        {active.custom && (
          <Collapsible title="Expression" icon={Icons.fx}>
            <ExpressionControls />
          </Collapsible>
        )}

        <Collapsible title="Parameters" icon={Icons.params}>
          {active.params.map((p) => (
            <ParamControl key={p.key} def={p} />
          ))}
          <button
            onClick={resetParams}
            className="mt-2 rounded-md px-2 py-1 text-xs text-stone-500 transition hover:bg-white/5 hover:text-vermilion-300"
          >
            ↺ Reset all parameters
          </button>
        </Collapsible>

        <Collapsible title="Color" icon={Icons.color}>
          <div className="mb-3">
            <PaletteGrid />
          </div>
          <ColorSlider label="Density" value={colorScale} min={0.1} max={5} step={0.05} fmt={(v) => v.toFixed(2)} onChange={(v) => setColor({ colorScale: v })} />
          <ColorSlider label="Offset" value={colorOffset} min={0} max={1} step={0.01} fmt={(v) => v.toFixed(2)} onChange={(v) => setColor({ colorOffset: v })} />
          <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-300">
            <input type="checkbox" className="accent-vermilion-400" checked={invert} onChange={(e) => setColor({ invert: e.target.checked })} />
            Invert colors
          </label>
        </Collapsible>

        <Collapsible title="Animate" icon={Icons.animate} defaultOpen={false}>
          <AnimateControls />
        </Collapsible>
      </div>
    </div>
  );
}
