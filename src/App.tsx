import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { GraphView } from "./components/graph/GraphView.tsx";
import { BlochView } from "./components/bloch/BlochView.tsx";
import { FourDView } from "./components/fourd/FourDView.tsx";
import { TopoView } from "./components/topo/TopoView.tsx";
import { DynamicsView } from "./components/dynamics/DynamicsView.tsx";
import { useStore, type AppMode } from "./store.ts";
import { useNotebook } from "./experiment/notebookStore.ts";
import { searchMath, type SearchEntry } from "./search/mathSearch.ts";
import { LogoMark } from "./components/Logo.tsx";
import { HomeView } from "./components/HomeView.tsx";
import { FractalWorkspace } from "./components/fractal/FractalWorkspace.tsx";

// KaTeX-heavy views are lazy-loaded to keep the initial bundle lean.
const DocsView = lazy(() => import("./components/docs/DocsView.tsx").then((m) => ({ default: m.DocsView })));
const Dynamics3DView = lazy(() => import("./components/dynamics3d/Dynamics3DView.tsx").then((m) => ({ default: m.Dynamics3DView })));
const InspectorView = lazy(() => import("./components/inspector/InspectorView.tsx").then((m) => ({ default: m.InspectorView })));
const NotebookView = lazy(() => import("./components/notebook/NotebookView.tsx").then((m) => ({ default: m.NotebookView })));

/** Drives parameter animation; animTick no-ops (no set) while paused. */
function useAnimDriver() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      useStore.getState().animTick(Math.min(dt, 0.05));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

function MathSearch() {
  const setAppMode = useStore((s) => s.setAppMode);
  const loadExample = useNotebook((s) => s.loadExample);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => (query.trim() ? searchMath(query) : []), [query]);

  const go = (e: SearchEntry) => {
    setQuery("");
    setOpen(false);
    if (e.kind === "workspace") {
      setAppMode(e.route as AppMode);
    } else if (e.kind === "doc") {
      setAppMode("docs");
      // Scroll after the lazy DocsView mounts.
      setTimeout(() => document.getElementById(`doc-${e.route}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } else if (e.kind === "example") {
      setAppMode("notebook");
      setTimeout(() => loadExample(e.route), 0);
    } else {
      setAppMode("inspector");
    }
  };

  const kindLabel: Record<SearchEntry["kind"], string> = { workspace: "wsp", doc: "doc", capability: "cap", example: "ex" };

  return (
    <div className="relative ml-auto" ref={boxRef}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search… (eigenvalue, RK4, Lorenz, …)"
        className="w-56 rounded bg-white/5 px-2 py-1 text-xs text-stone-200 outline-none ring-1 ring-white/10 focus:ring-vermilion-400/40"
      />
      {open && query.trim() && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-72 w-72 overflow-y-auto rounded border border-white/10 bg-[#1c1b18] shadow-xl">
          {hits.length === 0 && <div className="px-3 py-2 text-xs text-stone-500">No matches</div>}
          {hits.map((h) => (
            <button key={h.id} onMouseDown={() => go(h)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-stone-300 hover:bg-white/5">
              <span className="rounded bg-white/5 px-1 text-[9px] uppercase text-stone-500">{kindLabel[h.kind]}</span>
              <span className="truncate">{h.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeNav() {
  const appMode = useStore((s) => s.appMode);
  const setAppMode = useStore((s) => s.setAppMode);
  const tabs: { id: AppMode; label: string }[] = [
    { id: "calculator", label: "Calculator" },
    { id: "fractal", label: "Fractal Lab" },
    { id: "bloch", label: "Bloch Sphere" },
    { id: "fourd", label: "4D" },
    { id: "topo", label: "Topology" },
    { id: "dynamics", label: "Dynamics" },
    { id: "dynamics3d", label: "Dynamics 3D" },
    { id: "inspector", label: "Inspector" },
    { id: "notebook", label: "Notebook" },
    { id: "docs", label: "Docs" },
  ];
  return (
    <div className="graph-paper flex items-center gap-1 overflow-x-auto border-b border-line bg-void px-3 py-2 scroll-thin">
      <button
        onClick={() => setAppMode("home")}
        title="Back to workspaces"
        className="focusable mr-3 flex shrink-0 items-center gap-2 rounded-sm text-ink transition-opacity hover:opacity-80"
      >
        <LogoMark className="size-6 shrink-0" />
        <span className="font-display text-[19px] leading-none tracking-tight">
          Mathematics <em className="text-vermilion-400">Simulator</em>
        </span>
      </button>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setAppMode(t.id)}
          className={`shrink-0 rounded-sm px-3 py-1 text-xs font-medium transition ${
            appMode === t.id
              ? "bg-vermilion-500/15 text-vermilion-200 ring-1 ring-vermilion-400/40"
              : "text-graphite hover:bg-white/5 hover:text-ink"
          }`}
        >
          {t.label}
        </button>
      ))}
      <MathSearch />
    </div>
  );
}

export function App() {
  useAnimDriver();
  const appMode = useStore((s) => s.appMode);

  if (appMode === "home") return <HomeView />;

  return (
    <div className="flex h-full flex-col">
      <ModeNav />
      {appMode === "calculator" ? (
        <GraphView />
      ) : appMode === "bloch" ? (
        <BlochView />
      ) : appMode === "fourd" ? (
        <FourDView />
      ) : appMode === "topo" ? (
        <TopoView />
      ) : appMode === "dynamics" ? (
        <DynamicsView />
      ) : appMode === "dynamics3d" ? (
        <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading…</div>}>
          <Dynamics3DView />
        </Suspense>
      ) : appMode === "inspector" ? (
        <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading…</div>}>
          <InspectorView />
        </Suspense>
      ) : appMode === "notebook" ? (
        <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading…</div>}>
          <NotebookView />
        </Suspense>
      ) : appMode === "docs" ? (
        <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading…</div>}>
          <DocsView />
        </Suspense>
      ) : (
        <FractalWorkspace />
      )}
    </div>
  );
}
