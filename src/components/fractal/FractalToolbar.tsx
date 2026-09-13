import { useRef } from "react";
import { useStore, currentConfig, type ExportConfig } from "../../store.ts";
import { FRACTAL_BY_ID } from "../../fractals/registry.ts";
import type { Stats } from "../FractalCanvas.tsx";
import { LogoMark } from "../Logo.tsx";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Floating glass toolbar: fractal identity, live stats, and view actions. */
export function FractalToolbar({
  stats,
  panelOpen,
  onTogglePanel,
  onHideUi,
}: {
  stats: Stats;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onHideUi: () => void;
}) {
  const resetView = useStore((s) => s.resetView);
  const loadConfig = useStore((s) => s.loadConfig);
  const activeId = useStore((s) => s.activeId);
  const iterations = useStore((s) => s.params.iterations);
  const activeName = FRACTAL_BY_ID[activeId].name;
  const fileRef = useRef<HTMLInputElement>(null);

  const exportPng = () => {
    const canvas = document.querySelector("canvas");
    canvas?.toBlob((b) => b && download(`${activeId}-${Date.now()}.png`, b), "image/png");
  };
  const exportJson = () =>
    download(`${activeId}-config.json`, new Blob([JSON.stringify(currentConfig(), null, 2)], { type: "application/json" }));
  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => {
      try {
        loadConfig(JSON.parse(t) as ExportConfig);
      } catch {
        alert("Invalid config file.");
      }
    });
    e.target.value = "";
  };

  const btn = "rounded-md px-2.5 py-1 text-xs text-graphite transition hover:bg-white/10 hover:text-ink focusable";
  const iconBtn =
    "flex size-8 items-center justify-center rounded-md text-[15px] text-graphite transition hover:bg-white/10 hover:text-ink focusable";
  const Stat = ({ k, v }: { k: string; v: string | number }) => (
    <span className="mono-label text-graphite/70">
      {k}
      <b className="ml-1 font-mono text-[13px] text-vermilion-300">{v}</b>
    </span>
  );

  return (
    <div className="absolute inset-x-3 top-3 z-20 flex h-12 items-center gap-3 rounded-xl border border-line bg-void-soft/80 px-2.5 shadow-lg backdrop-blur-xl">
      <button onClick={onTogglePanel} className={iconBtn} title={panelOpen ? "Hide controls" : "Show controls"} aria-label="Toggle controls">
        {panelOpen ? "⟨" : "⟩"}
      </button>
      <span className="flex items-center gap-2 text-ink">
        <LogoMark className="size-5" />
        <span className="mono-label hidden text-vermilion-300 sm:inline">Fractal Lab</span>
      </span>
      <span className="h-5 w-px bg-line" aria-hidden />
      <span className="font-display text-lg leading-none tracking-tight text-ink">{activeName}</span>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden items-center gap-3.5 lg:flex">
          <Stat k="FPS" v={stats.fps} />
          <Stat k="Render" v={stats.ms < 0 ? "—" : `${stats.ms}ms`} />
          <Stat k="Iter" v={iterations} />
        </div>
        <div className="flex items-center gap-1">
          <button className={iconBtn} onClick={onHideUi} title="Hide UI (H)" aria-label="Hide UI">
            <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
              <path d="M2 12 C 5 6, 19 6, 22 12 C 19 18, 5 18, 2 12 Z" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button className={iconBtn} onClick={resetView} title="Reset view" aria-label="Reset view">⟲</button>
          <button className={btn} onClick={exportJson} title="Save config">Save</button>
          <button className={btn} onClick={() => fileRef.current?.click()} title="Load config">Load</button>
          <button
            className="rounded-md bg-vermilion-500/15 px-2.5 py-1 text-xs font-medium text-vermilion-200 transition hover:bg-vermilion-500/25 hover:text-vermilion-100 focusable"
            onClick={exportPng}
            title="Export PNG"
          >
            Export PNG
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
        </div>
      </div>
    </div>
  );
}
