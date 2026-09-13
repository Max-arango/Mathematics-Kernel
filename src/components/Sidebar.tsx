import { useStore, PALETTES, FRACTALS } from "../store.ts";
import { FRACTAL_BY_ID } from "../fractals/registry.ts";
import { paletteGradient } from "../fractals/palettes.ts";
import type { ParamDef } from "../fractals/types.ts";
import { AnimatePanel } from "./AnimatePanel.tsx";
import { ExpressionPanel } from "./ExpressionPanel.tsx";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-4 py-3.5">
      <h2 className="mono-label mb-2.5 flex items-center gap-2 text-vermilion-300/80">
        <span aria-hidden className="inline-block size-[6px] bg-vermilion-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Vermilion-filled range track showing the value's position in [min,max]. */
export function rangeFill(v: number, min: number, max: number): React.CSSProperties {
  const p = max > min ? ((v - min) / (max - min)) * 100 : 0;
  return { background: `linear-gradient(to right, #e0673d ${p}%, rgba(240,238,229,0.14) ${p}%)` };
}

function ParamControl({ def }: { def: ParamDef }) {
  const value = useStore((s) => s.params[def.key] ?? def.default);
  const setParam = useStore((s) => s.setParam);
  const decimals = def.step < 1 ? Math.min(4, `${def.step}`.split(".")[1]?.length ?? 2) : 0;
  const atDefault = value === def.default;

  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-stone-300">{def.label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-20 rounded-md bg-stone-800/70 px-1.5 py-0.5 text-right font-mono text-vermilion-200 tabular-nums outline-none ring-1 ring-line focus:ring-vermilion-400/60"
            value={value}
            min={def.min}
            max={def.max}
            step={def.step}
            onChange={(e) => setParam(def.key, Number(e.target.value))}
          />
          <button
            title="Reset to default"
            className={`transition ${atDefault ? "text-stone-700" : "text-stone-500 hover:text-vermilion-300"}`}
            onClick={() => setParam(def.key, def.default)}
          >
            ↺
          </button>
        </div>
      </div>
      <input
        type="range"
        className="w-full"
        style={rangeFill(value, def.min, def.max)}
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => setParam(def.key, Number(e.target.value))}
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-stone-600">
        <span>{def.min}</span>
        <span className="tabular-nums text-stone-400">{value.toFixed(decimals)}</span>
        <span>{def.max}</span>
      </div>
    </div>
  );
}

/** Labelled slider with a live value readout (Color section). */
function ColorSlider({
  label,
  value,
  min,
  max,
  step,
  fmt,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between text-xs text-stone-300">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-vermilion-200">{fmt(value)}</span>
      </div>
      <input
        type="range"
        className="w-full"
        style={rangeFill(value, min, max)}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Sidebar() {
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const resetParams = useStore((s) => s.resetParams);
  const pickMode = useStore((s) => s.pickMode);
  const setPickMode = useStore((s) => s.setPickMode);
  const palette = useStore((s) => s.palette);
  const colorScale = useStore((s) => s.colorScale);
  const colorOffset = useStore((s) => s.colorOffset);
  const invert = useStore((s) => s.invert);
  const setColor = useStore((s) => s.setColor);

  const active = FRACTAL_BY_ID[activeId];

  return (
    <aside className="scroll-thin flex w-72 shrink-0 flex-col overflow-y-auto border-r border-line bg-void-soft">
      <Section title="Fractal">
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
                <span
                  aria-hidden
                  className={`h-3.5 w-[3px] rounded-full transition ${on ? "bg-vermilion-400" : "bg-transparent"}`}
                />
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
      </Section>

      {active.custom && <ExpressionPanel />}

      <Section title="Parameters">
        {active.params.map((p) => (
          <ParamControl key={p.key} def={p} />
        ))}
        <button
          onClick={resetParams}
          className="mt-1 rounded-md px-2 py-1 text-xs text-stone-500 transition hover:bg-white/5 hover:text-vermilion-300"
        >
          ↺ Reset all parameters
        </button>
      </Section>

      <AnimatePanel />

      <Section title="Color">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {PALETTES.map((name, i) => {
            const on = palette === i;
            return (
              <button
                key={name}
                onClick={() => setColor({ palette: i })}
                title={name}
                className={`group overflow-hidden rounded-md ring-1 transition ${
                  on ? "ring-2 ring-vermilion-400/80" : "ring-line hover:ring-white/25"
                }`}
              >
                <span className="block h-7 w-full" style={{ background: paletteGradient(i) }} />
                <span className={`block px-1.5 py-1 text-left text-[10px] ${on ? "text-vermilion-200" : "text-stone-400"}`}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>
        <ColorSlider
          label="Density"
          value={colorScale}
          min={0.1}
          max={5}
          step={0.05}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => setColor({ colorScale: v })}
        />
        <ColorSlider
          label="Offset"
          value={colorOffset}
          min={0}
          max={1}
          step={0.01}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => setColor({ colorOffset: v })}
        />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-300">
          <input
            type="checkbox"
            className="accent-vermilion-400"
            checked={invert}
            onChange={(e) => setColor({ invert: e.target.checked })}
          />
          Invert colors
        </label>
      </Section>
    </aside>
  );
}
