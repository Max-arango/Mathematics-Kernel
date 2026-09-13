import { useStore, PALETTES } from "../../store.ts";
import { paletteGradient } from "../../fractals/palettes.ts";
import type { ParamDef } from "../../fractals/types.ts";

/** Vermilion-filled range track showing the value's position in [min,max]. */
export function rangeFill(v: number, min: number, max: number): React.CSSProperties {
  const p = max > min ? ((v - min) / (max - min)) * 100 : 0;
  return { background: `linear-gradient(to right, #e0673d ${p}%, rgba(240,238,229,0.14) ${p}%)` };
}

export function ParamControl({ def }: { def: ParamDef }) {
  const value = useStore((s) => s.params[def.key] ?? def.default);
  const setParam = useStore((s) => s.setParam);
  const decimals = def.step < 1 ? Math.min(4, `${def.step}`.split(".")[1]?.length ?? 2) : 0;
  const atDefault = value === def.default;

  return (
    <div className="mb-3.5 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-stone-300">{def.label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-20 rounded-md bg-black/30 px-1.5 py-0.5 text-right font-mono text-vermilion-200 tabular-nums outline-none ring-1 ring-line focus:ring-vermilion-400/60"
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

/** Labelled slider with a live value readout. */
export function ColorSlider({
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
    <div className="mb-3 last:mb-0">
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

/** Gradient-swatch palette picker matched to the GPU cosine palettes. */
export function PaletteGrid() {
  const palette = useStore((s) => s.palette);
  const setColor = useStore((s) => s.setColor);
  return (
    <div className="grid grid-cols-2 gap-1.5">
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
  );
}
