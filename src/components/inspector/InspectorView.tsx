import { useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { inspect, compare } from "../../inspector/engine.ts";
import type { MathObject, Confidence, Property } from "../../inspector/types.ts";
import { SURFACES } from "../../topo/surfaces.ts";
import { methodsByFamily } from "../../mathlab/core/numericalMethods.ts";

const ODE_METHODS = methodsByFamily("ODESolver");

const CONF_COLOR: Record<Confidence, string> = {
  exact: "bg-emerald-500/15 text-emerald-300",
  symbolic: "bg-vermilion-500/15 text-vermilion-300",
  numerical: "bg-sky-500/15 text-sky-300",
  estimated: "bg-amber-500/15 text-amber-300",
  inferred: "bg-violet-500/15 text-violet-300",
  heuristic: "bg-orange-500/15 text-orange-300",
  unsupported: "bg-red-500/15 text-red-300",
  notApplicable: "bg-stone-600/20 text-stone-400",
};

function Tex({ src, display = false }: { src: string; display?: boolean }) {
  const html = useMemo(() => katex.renderToString(src, { displayMode: display, throwOnError: false, output: "htmlAndMathml" }), [src, display]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function PropRow({ p }: { p: Property }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 py-1 last:border-0">
      <span className="shrink-0 text-xs text-stone-400">{p.label}</span>
      <span className="min-w-0 flex-1 text-right font-mono text-xs text-stone-100">
        {p.latex ? <Tex src={p.latex} /> : p.value}
        {p.note && <span className="ml-1 text-[10px] text-stone-500">({p.note})</span>}
      </span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${CONF_COLOR[p.confidence]}`}>{p.confidence}</span>
    </div>
  );
}

// The kinds this UI offers an input form for. Covers the Phase I core kinds plus the
// Phase IV domain kinds the Inspector engine now registers (dynamical systems, ODEs,
// distributions, datasets, time series).
type Kind = "expression" | "matrix" | "vector" | "topology" | "dynamicalSystem" | "ode" | "distribution" | "dataset" | "timeSeries";

function parseMatrix(text: string): number[][] {
  return text.trim().split("\n").map((row) => row.trim().split(/[\s,]+/).map(Number));
}
function parseVector(text: string): number[] {
  return text.trim().split(/[\s,]+/).map(Number);
}
function parseNumbers(text: string): number[] {
  return text.trim().split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n));
}
function parseParams(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of text.split(/[,\s]+/)) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    const k = part.slice(0, i).trim();
    const v = Number(part.slice(i + 1).trim());
    if (k && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export function InspectorView() {
  const [kind, setKind] = useState<Kind>("expression");
  const [exprSrc, setExprSrc] = useState("x^3 - 3x + 1");
  const [matText, setMatText] = useState("2 -1\n1 2");
  const [vecText, setVecText] = useState("3, 4, 12");
  const [surfId, setSurfId] = useState("torus");
  // Phase IV domain inputs.
  const [sysVars, setSysVars] = useState("x, y");
  const [sysField, setSysField] = useState("y\n-x");
  const [odeVars, setOdeVars] = useState("x");
  const [odeField, setOdeField] = useState("-x");
  const [odeY0, setOdeY0] = useState("1");
  const [odeT0, setOdeT0] = useState("0");
  const [odeT1, setOdeT1] = useState("10");
  const [odeMethod, setOdeMethod] = useState("rk4");
  const [distName, setDistName] = useState("normal");
  const [distParams, setDistParams] = useState("mu=0, sigma=1");
  const [tsT, setTsT] = useState("0, 1, 2, 3, 4");
  const [tsY, setTsY] = useState("0, 1, 4, 9, 16");
  const [history, setHistory] = useState<MathObject[]>([]);
  const [cmpId, setCmpId] = useState("sphere");
  const [cmpExpr, setCmpExpr] = useState("(x-1)*(x^2-2x+1)");

  const obj: MathObject = useMemo(() => {
    switch (kind) {
      case "expression": return { kind: "expression", source: exprSrc };
      case "matrix": return { kind: "matrix", data: parseMatrix(matText) };
      case "vector": return { kind: "vector", data: parseVector(vecText) };
      case "topology": return { kind: "topology", surfaceId: surfId };
      case "dynamicalSystem": return { kind: "dynamicalSystem", vars: sysVars.split(",").map((s) => s.trim()), fieldSource: sysField.split("\n").map((s) => s.trim()), systemKind: "continuous" };
      case "ode": return { kind: "ode", vars: odeVars.split(",").map((s) => s.trim()), fieldSource: odeField.split("\n").map((s) => s.trim()), y0: parseVector(odeY0), t0: Number(odeT0), t1: Number(odeT1), method: odeMethod };
      case "distribution": return { kind: "distribution", name: distName, params: parseParams(distParams) };
      case "dataset": return { kind: "dataset", source: "samples", data: parseNumbers(tsY), };
      case "timeSeries": return { kind: "timeSeries", t: parseNumbers(tsT), y: parseNumbers(tsY) };
    }
  }, [kind, exprSrc, matText, vecText, surfId, sysVars, sysField, odeVars, odeField, odeY0, odeT0, odeT1, odeMethod, distName, distParams, tsT, tsY]);

  const result = useMemo(() => inspect(obj), [obj]);

  const comparison = useMemo(() => {
    if (kind === "topology") return compare(obj, { kind: "topology", surfaceId: cmpId });
    if (kind === "expression") return compare(obj, { kind: "expression", source: cmpExpr });
    return null;
  }, [obj, kind, cmpId, cmpExpr]);

  const inputCls = "w-full rounded bg-stone-800/80 px-2 py-1.5 font-mono text-sm text-vermilion-100 outline-none focus:ring-1 focus:ring-vermilion-400";

  const navigate = (target: MathObject) => {
    setHistory((h) => [...h, obj]);
    if (target.kind === "expression") { setKind("expression"); setExprSrc(target.source); }
    else if (target.kind === "matrix") { setKind("matrix"); setMatText(target.data.map((r) => r.join(" ")).join("\n")); }
    else if (target.kind === "vector") { setKind("vector"); setVecText(target.data.join(", ")); }
  };
  const back = () => setHistory((h) => {
    const prev = h.at(-1); if (!prev) return h;
    if (prev.kind === "expression") { setKind("expression"); setExprSrc(prev.source); }
    else if (prev.kind === "matrix") { setKind("matrix"); setMatText(prev.data.map((r) => r.join(" ")).join("\n")); }
    else if (prev.kind === "vector") { setKind("vector"); setVecText(prev.data.join(", ")); }
    else if (prev.kind === "topology") { setKind("topology"); setSurfId(prev.surfaceId); }
    return h.slice(0, -1);
  });

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left: object input */}
      <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-r border-white/5 bg-[#1c1b18] p-3">
        <div>
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-vermilion-300/70">Object</h2>
          <div className="grid grid-cols-4 gap-1">
            {(["expression", "matrix", "vector", "topology", "dynamicalSystem", "ode", "distribution", "dataset", "timeSeries"] as Kind[]).map((k) => (
              <button key={k} onClick={() => setKind(k)}
                className={`rounded px-1 py-1 text-[11px] capitalize transition ${kind === k ? "bg-vermilion-500/15 text-vermilion-200 ring-1 ring-vermilion-400/40" : "text-stone-400 hover:bg-white/5"}`}>
                {k === "expression" ? "expr" : k === "dynamicalSystem" ? "dyn sys" : k === "timeSeries" ? "time ser." : k}
              </button>
            ))}
          </div>
        </div>

        {kind === "expression" && <input className={inputCls} value={exprSrc} spellCheck={false} onChange={(e) => setExprSrc(e.target.value)} />}
        {kind === "matrix" && <textarea className={`${inputCls} h-24 resize-none`} value={matText} spellCheck={false} onChange={(e) => setMatText(e.target.value)} placeholder="rows: 1 2\n3 4" />}
        {kind === "vector" && <input className={inputCls} value={vecText} spellCheck={false} onChange={(e) => setVecText(e.target.value)} placeholder="3, 4, 12" />}
        {kind === "topology" && (
          <select className={inputCls} value={surfId} onChange={(e) => setSurfId(e.target.value)}>
            {SURFACES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
        {kind === "dynamicalSystem" && (
          <>
            <div>
              <label className="text-[10px] uppercase text-stone-500">state variables (comma-separated)</label>
              <input className={inputCls} value={sysVars} spellCheck={false} onChange={(e) => setSysVars(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase text-stone-500">dx_i/dt (one per line)</label>
              <textarea className={`${inputCls} h-20 resize-none`} value={sysField} spellCheck={false} onChange={(e) => setSysField(e.target.value)} />
            </div>
          </>
        )}
        {kind === "ode" && (
          <>
            <input className={inputCls} value={odeVars} spellCheck={false} onChange={(e) => setOdeVars(e.target.value)} placeholder="state vars: x" />
            <textarea className={`${inputCls} h-16 resize-none`} value={odeField} spellCheck={false} onChange={(e) => setOdeField(e.target.value)} placeholder="dx/dt: -x" />
            <div className="grid grid-cols-2 gap-1">
              <div><label className="text-[10px] uppercase text-stone-500">y₀</label><input className={inputCls} value={odeY0} onChange={(e) => setOdeY0(e.target.value)} /></div>
              <div><label className="text-[10px] uppercase text-stone-500">method</label>
                <select className={inputCls} value={odeMethod} onChange={(e) => setOdeMethod(e.target.value)}>
                  {ODE_METHODS.map((m) => <option key={m.name} value={m.name} title={m.description}>{m.name}</option>)}
                </select>
              </div>
              <div><label className="text-[10px] uppercase text-stone-500">t₀</label><input className={inputCls} value={odeT0} onChange={(e) => setOdeT0(e.target.value)} /></div>
              <div><label className="text-[10px] uppercase text-stone-500">t₁</label><input className={inputCls} value={odeT1} onChange={(e) => setOdeT1(e.target.value)} /></div>
            </div>
          </>
        )}
        {kind === "distribution" && (
          <>
            <select className={inputCls} value={distName} onChange={(e) => setDistName(e.target.value)}>
              {["bernoulli", "binomial", "uniform", "normal", "exponential", "poisson"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input className={inputCls} value={distParams} spellCheck={false} onChange={(e) => setDistParams(e.target.value)} placeholder="mu=0, sigma=1" />
          </>
        )}
        {kind === "dataset" && (
          <div>
            <label className="text-[10px] uppercase text-stone-500">sample values (space/comma-separated)</label>
            <input className={inputCls} value={tsY} spellCheck={false} onChange={(e) => setTsY(e.target.value)} placeholder="1, 2, 3, 4" />
          </div>
        )}
        {kind === "timeSeries" && (
          <>
            <div>
              <label className="text-[10px] uppercase text-stone-500">t</label>
              <input className={inputCls} value={tsT} spellCheck={false} onChange={(e) => setTsT(e.target.value)} placeholder="0, 1, 2, 3" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-stone-500">y</label>
              <input className={inputCls} value={tsY} spellCheck={false} onChange={(e) => setTsY(e.target.value)} placeholder="0, 1, 4, 9" />
            </div>
          </>
        )}

        {/* Capabilities */}
        {result.capabilities.length > 0 && (
          <div>
            <h3 className="mb-1 text-[10px] uppercase tracking-wide text-stone-500">Capabilities</h3>
            <div className="flex flex-wrap gap-1">
              {result.capabilities.map((c) => <span key={c} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-stone-300">{c}</span>)}
            </div>
          </div>
        )}

        {/* Compare */}
        {(kind === "topology" || kind === "expression") && (
          <div>
            <h3 className="mb-1 text-[10px] uppercase tracking-wide text-stone-500">Compare with</h3>
            {kind === "topology"
              ? <select className={inputCls} value={cmpId} onChange={(e) => setCmpId(e.target.value)}>{SURFACES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
              : <input className={inputCls} value={cmpExpr} spellCheck={false} onChange={(e) => setCmpExpr(e.target.value)} />}
            {comparison && (
              <div className="mt-1.5 rounded bg-black/40 p-2 text-[11px] text-stone-300">
                <div className="mb-1"><span className={`rounded px-1 ${CONF_COLOR[comparison.confidence]}`}>{comparison.confidence}</span> {comparison.verdict}</div>
                {comparison.rows.map((r) => (
                  <div key={r.label} className="flex justify-between font-mono text-[10px]">
                    <span className="text-stone-500">{r.label}</span>
                    <span className={r.same ? "text-emerald-300" : "text-red-300"}>{r.a} {r.same ? "=" : "≠"} {r.b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {history.length > 0 && <button onClick={back} className="mt-auto rounded bg-white/5 px-2 py-1 text-xs text-stone-400 hover:text-vermilion-200">← Back ({history.length})</button>}
      </aside>

      {/* Right: inspection result */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <div className="mb-1 text-lg font-semibold text-stone-100">{result.identity}</div>
          {result.latex && <div className="mb-4 rounded bg-black/30 px-4 py-2 text-vermilion-100 ring-1 ring-white/5"><Tex src={result.latex} display /></div>}

          {result.sections.map((s) => (
            <section key={s.title} className="mb-4">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-vermilion-300/70">{s.title}</h3>
              <div className="rounded bg-white/[0.02] px-3 py-1 ring-1 ring-white/5">
                {s.properties.map((p, i) => <PropRow key={i} p={p} />)}
              </div>
            </section>
          ))}

          {result.relations.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-vermilion-300/70">Related objects</h3>
              <div className="flex flex-col gap-1">
                {result.relations.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-white/[0.02] px-3 py-1.5 text-xs ring-1 ring-white/5">
                    <span className="min-w-0 text-stone-300">{r.label}{r.description && <span className="ml-2 font-mono text-[11px] text-stone-500">{r.description}</span>}</span>
                    {r.target && <button onClick={() => navigate(r.target!)} className="shrink-0 rounded bg-vermilion-500/15 px-2 py-0.5 text-vermilion-200 hover:bg-vermilion-500/25">inspect →</button>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.warnings.length > 0 && (
            <section>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-amber-300/70">Assumptions & limits</h3>
              <ul className="ml-4 list-disc space-y-0.5 text-[11px] text-stone-400 marker:text-amber-400/60">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
