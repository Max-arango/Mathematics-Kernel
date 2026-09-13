import { useEffect, useMemo, useRef, useState } from "react";
import { useGraph } from "../../graph/graphStore.ts";
import { buildScene, type Scene } from "../../mathlab/graph/scene.ts";
import { compile1 } from "../../mathlab/core/eval.ts";
import { derivative } from "../../mathlab/calculus/derivative.ts";
import { resolveSlider, snap } from "../../graph/sliderConfig.ts";
import { ExpressionList } from "./ExpressionList.tsx";
import { Plot2D } from "./Plot2D.tsx";
import { Plot3D } from "./Plot3D.tsx";
import { AnalysisBar } from "./AnalysisBar.tsx";
import { WorkspaceShell } from "../workspace/WorkspaceShell.tsx";

export function GraphView() {
  const lines = useGraph((s) => s.lines);
  const mode = useGraph((s) => s.mode);
  const sliderValues = useGraph((s) => s.sliderValues);
  const [trace, setTrace] = useState<{ x: number; y: number } | null>(null);

  const scene = useMemo(() => buildScene(lines, mode, sliderValues), [lines, mode, sliderValues]);

  // Slider animation driver (needs the live scene env to resolve bounds).
  const sceneRef = useRef<Scene>(scene);
  sceneRef.current = scene;
  const rawRef = useRef<{ name: string | null; value: number }>({ name: null, value: 0 });
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const st = useGraph.getState();
      const a = st.anim;
      const sc = sceneRef.current;
      const slider = a.name ? sc.sliders.find((s) => s.name === a.name) : undefined;
      if (a.playing && a.name && slider) {
        const { min, max, step } = resolveSlider(slider, st.sliderConfig[a.name], sc.env);
        const range = max - min;
        if (range > 0) {
          if (rawRef.current.name !== a.name) rawRef.current = { name: a.name, value: st.sliderValues[a.name] ?? slider.value };
          let v = rawRef.current.value + a.dir * a.speed * range * dt;
          if (a.mode === "loop") {
            if (v > max) v = min;
            else if (v < min) v = max;
          } else {
            if (v > max) { v = max; st.setAnim({ dir: -1 }); }
            else if (v < min) { v = min; st.setAnim({ dir: 1 }); }
          }
          rawRef.current.value = v;
          st.setSlider(a.name, snap(v, min, step));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Trace readout: value + slope of the first curve at the cursor x.
  const readout = useMemo(() => {
    if (!trace || mode !== "2d" || !scene.plots[0]) return null;
    try {
      const f = compile1(scene.plots[0].body, "x", scene.env);
      const df = compile1(derivative(scene.plots[0].body, "x"), "x", scene.env);
      return { fx: f(trace.x), dfx: df(trace.x) };
    } catch {
      return null;
    }
  }, [trace, scene, mode]);

  return (
    <WorkspaceShell title="Calculator" panelWidth={320} panel={<ExpressionList scene={scene} />}>
      {mode === "2d" ? <Plot2D scene={scene} onTrace={setTrace} /> : <Plot3D scene={scene} />}
      {mode === "2d" && (
        <div className="absolute right-3 top-[68px] z-10 max-w-[calc(100%-1.5rem)]">
          <AnalysisBar scene={scene} />
        </div>
      )}
      {mode === "2d" && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-line bg-void-soft/75 px-3 py-1.5 font-mono text-[11px] tabular-nums text-stone-300 backdrop-blur-md">
          {trace ? (
            <>
              x = {trace.x.toFixed(4)} &nbsp; y = {trace.y.toFixed(4)}
              {readout && Number.isFinite(readout.fx) && (
                <>
                  {"  "}· f(x) = <span className="text-vermilion-300">{readout.fx.toFixed(4)}</span>
                  {"  "}· f'(x) = <span className="text-emerald-300">{readout.dfx.toFixed(4)}</span>
                </>
              )}
            </>
          ) : (
            "move cursor over graph to trace"
          )}
        </div>
      )}
    </WorkspaceShell>
  );
}
