import { useStore, type AnimMode } from "../store.ts";
import { FRACTAL_BY_ID } from "../fractals/registry.ts";
import { rangeFill } from "./fractal/controls.tsx";

const MODES: AnimMode[] = ["loop", "pingpong", "once"];
const MODE_LABEL: Record<AnimMode, string> = { loop: "Loop", pingpong: "Ping-pong", once: "Once" };

/** Parameter-animation controls (bare content; hosted inside a Collapsible). */
export function AnimateControls() {
  const activeId = useStore((s) => s.activeId);
  const anim = useStore((s) => s.anim);
  const setAnim = useStore((s) => s.setAnim);
  const animBind = useStore((s) => s.animBind);
  const animToggle = useStore((s) => s.animToggle);

  const params = FRACTAL_BY_ID[activeId].params;
  const num = "w-20 rounded-md bg-black/30 px-1.5 py-0.5 text-right font-mono text-vermilion-200 tabular-nums outline-none ring-1 ring-line focus:ring-vermilion-400/60";

  return (
    <>
      <select
        className="mb-2 w-full rounded-md bg-black/30 px-2 py-1.5 text-sm text-stone-200 outline-none ring-1 ring-line focus:ring-vermilion-400/60"
        value={anim.key ?? ""}
        onChange={(e) => (e.target.value ? animBind(e.target.value) : setAnim({ key: null, playing: false }))}
      >
        <option value="">— pick a parameter —</option>
        {params.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </select>

      {anim.key && (
        <>
          <div className="mb-2.5 flex items-center justify-between text-xs text-stone-300">
            <span>Range</span>
            <div className="flex items-center gap-1">
              <input type="number" className={num} value={anim.from} onChange={(e) => setAnim({ from: Number(e.target.value) })} />
              <span className="text-stone-500">→</span>
              <input type="number" className={num} value={anim.to} onChange={(e) => setAnim({ to: Number(e.target.value) })} />
            </div>
          </div>

          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs text-stone-300">
              <span>Speed</span>
              <span className="font-mono tabular-nums text-vermilion-200">{anim.speed.toFixed(2)}/s</span>
            </div>
            <input type="range" className="w-full" style={rangeFill(anim.speed, 0.02, 2)} min={0.02} max={2} step={0.01} value={anim.speed} onChange={(e) => setAnim({ speed: Number(e.target.value) })} />
          </div>

          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs text-stone-300">
              <span>Steps</span>
              <span className="font-mono tabular-nums text-vermilion-200">{anim.steps === 0 ? "smooth" : anim.steps}</span>
            </div>
            <input type="range" className="w-full" style={rangeFill(anim.steps, 0, 64)} min={0} max={64} step={1} value={anim.steps} onChange={(e) => setAnim({ steps: Number(e.target.value) })} />
          </div>

          <div className="mb-2.5 grid grid-cols-3 gap-1">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setAnim({ mode: m })}
                className={`rounded-md px-1 py-1 text-[11px] transition ${
                  anim.mode === m ? "bg-vermilion-500/15 text-vermilion-200 ring-1 ring-vermilion-400/40" : "text-stone-400 hover:bg-white/5"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={animToggle}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                anim.playing
                  ? "bg-vermilion-500/25 text-vermilion-100 ring-1 ring-vermilion-400/50"
                  : "bg-vermilion-500/15 text-vermilion-200 hover:bg-vermilion-500/25"
              }`}
            >
              {anim.playing ? "❚❚ Pause" : "▶ Play"}
            </button>
            <button
              onClick={() => setAnim({ phase: 0, dir: 1 })}
              title="Reset animation"
              className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-stone-400 transition hover:text-vermilion-200"
            >
              ↺
            </button>
          </div>
        </>
      )}
    </>
  );
}
