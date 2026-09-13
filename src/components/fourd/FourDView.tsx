import { useMemo } from "react";
import { Plot4D } from "./Plot4D.tsx";
import { WorkspaceShell } from "../workspace/WorkspaceShell.tsx";
import { useFour, type ShapeKind } from "../../fourd/fourStore.ts";
import { POLYTOPES, POLYTOPE_LABELS } from "../../fourd/shapes.ts";
import { buildParametric, PARAM_PRESETS } from "../../fourd/parametric.ts";
import { PLANES, type Angles6 } from "../../fourd/vec4.ts";

const PLANE_LABEL: Record<keyof Angles6, string> = { xy: "XY", xz: "XZ", xw: "XW", yz: "YZ", yw: "YW", zw: "ZW" };

export function FourDView() {
  const kind = useFour((s) => s.kind);
  const setKind = useFour((s) => s.setKind);
  const angles = useFour((s) => s.angles);
  const setAngle = useFour((s) => s.setAngle);
  const resetAngles = useFour((s) => s.resetAngles);
  const dist = useFour((s) => s.dist);
  const setDist = useFour((s) => s.setDist);
  const res = useFour((s) => s.res);
  const setRes = useFour((s) => s.setRes);
  const exprs = useFour((s) => s.exprs);
  const setExpr = useFour((s) => s.setExpr);
  const setPreset = useFour((s) => s.setPreset);
  const anim = useFour((s) => s.anim);
  const toggleAnim = useFour((s) => s.toggleAnim);
  const setSpeed = useFour((s) => s.setSpeed);

  const built = useMemo(() => {
    if (kind === "parametric") return buildParametric(exprs, res);
    return { shape: POLYTOPES[kind](), error: null as string | null };
  }, [kind, exprs, res]);

  const kinds: { id: ShapeKind; label: string }[] = [
    { id: "tesseract", label: "Tesseract" },
    { id: "cell5", label: "5-cell" },
    { id: "cell16", label: "16-cell" },
    { id: "cell24", label: "24-cell" },
    { id: "parametric", label: "Parametric" },
  ];
  const exprIn = "w-full rounded bg-stone-800/80 px-1.5 py-1 font-mono text-[12px] text-vermilion-100 outline-none focus:ring-1 focus:ring-vermilion-400";

  return (
    <WorkspaceShell
      title="4D Geometry"
      panelWidth={320}
      panel={
        <div className="flex flex-col">
        <Section title="Object">
          <div className="grid grid-cols-2 gap-1">
            {kinds.map((k) => (
              <button key={k.id} onClick={() => setKind(k.id)}
                className={`rounded px-2 py-1.5 text-xs transition ${kind === k.id ? "bg-vermilion-500/15 text-vermilion-200 ring-1 ring-vermilion-400/40" : "text-stone-400 hover:bg-white/5"}`}>
                {k.label}
              </button>
            ))}
          </div>
          {kind !== "parametric" && <p className="mt-2 text-[11px] text-stone-500">{POLYTOPE_LABELS[kind]}</p>}
        </Section>

        {kind === "parametric" && (
          <Section title="Surface (u, v) → ℝ⁴">
            {(["x", "y", "z", "w"] as const).map((c) => (
              <label key={c} className="mb-1.5 flex items-center gap-2">
                <span className="w-4 font-mono text-xs text-stone-400">{c}=</span>
                <input className={exprIn} value={exprs[c]} spellCheck={false} onChange={(e) => setExpr(c, e.target.value)} />
              </label>
            ))}
            {built.error && <p className="mb-1 text-[11px] text-red-300">{built.error}</p>}
            <div className="mb-2 flex flex-wrap gap-1">
              {Object.entries(PARAM_PRESETS).map(([name, e]) => (
                <button key={name} onClick={() => setPreset(e)} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-stone-400 hover:bg-white/10 hover:text-vermilion-200">{name}</button>
              ))}
            </div>
            <label className="flex items-center justify-between text-xs text-stone-300">
              <span>grid</span>
              <input type="range" className="w-40" min={4} max={64} step={2} value={res} onChange={(e) => setRes(Number(e.target.value))} />
            </label>
          </Section>
        )}

        <Section title="4D rotation (6 planes)">
          {PLANES.map((pl) => (
            <div key={pl} className="mb-1">
              <div className="flex justify-between text-[11px] text-stone-300">
                <span className="font-mono">{PLANE_LABEL[pl]}</span>
                <span className="tabular-nums text-vermilion-200">{((angles[pl] * 180 / Math.PI) % 360).toFixed(0)}°</span>
              </div>
              <input type="range" className="w-full" min={0} max={2 * Math.PI} step={0.01} value={((angles[pl] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)} onChange={(e) => setAngle(pl, Number(e.target.value))} />
            </div>
          ))}
          <button onClick={resetAngles} className="mt-1 text-xs text-stone-500 hover:text-vermilion-300">Reset rotation</button>
        </Section>

        <Section title="Projection & animation">
          <label className="mb-2 flex items-center justify-between text-xs text-stone-300">
            <span>4D distance d</span>
            <input type="range" className="w-40" min={1.5} max={6} step={0.1} value={dist} onChange={(e) => setDist(Number(e.target.value))} />
          </label>
          <div className="flex items-center gap-2">
            <button onClick={toggleAnim} className={`flex-1 rounded py-1.5 text-xs font-medium ${anim.playing ? "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-400/50" : "bg-vermilion-500/15 text-vermilion-200"}`}>
              {anim.playing ? "❚❚ Pause" : "▶ Play"}
            </button>
            <input type="range" className="flex-1" min={0.05} max={1.5} step={0.05} value={anim.speed} onChange={(e) => setSpeed(Number(e.target.value))} />
          </div>
          <p className="mt-1.5 text-[10px] text-stone-600">auto = double rotation (XW + YZ) · color = w (4th axis)</p>
        </Section>
        </div>
      }
    >
      <Plot4D shape={built.shape} />
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-line bg-void-soft/75 px-3 py-1.5 font-mono text-[11px] text-stone-400 backdrop-blur-md">
        {built.shape.vertices.length} vertices · {built.shape.edges.length} edges · color = 4th dimension (w) · drag = rotate 3D · wheel = zoom
      </div>
    </WorkspaceShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 px-4 py-3">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-vermilion-300/70">{title}</h2>
      {children}
    </div>
  );
}
