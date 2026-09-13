import { useRef } from "react";
import { useStore, currentConfig, type ExportConfig } from "../store.ts";
import type { Stats } from "./FractalCanvas.tsx";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Topbar({ stats }: { stats: Stats }) {
  const resetView = useStore((s) => s.resetView);
  const loadConfig = useStore((s) => s.loadConfig);
  const activeId = useStore((s) => s.activeId);
  const iterations = useStore((s) => s.params.iterations);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportPng = () => {
    // preserveDrawingBuffer keeps the last frame readable.
    const canvas = document.querySelector("canvas");
    canvas?.toBlob((b) => b && download(`${activeId}-${Date.now()}.png`, b), "image/png");
  };

  const exportJson = () => {
    download(`${activeId}-config.json`, new Blob([JSON.stringify(currentConfig(), null, 2)], { type: "application/json" }));
  };

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

  const btn = "rounded-sm px-2.5 py-1 text-xs text-graphite hover:bg-white/10 hover:text-ink transition";

  return (
    <header className="flex items-center gap-4 border-b border-line bg-void-soft px-4 py-2">
      <span className="mono-label text-vermilion-300">Fractal Lab</span>
      <div className="flex gap-4 text-[11px] tabular-nums text-graphite">
        <span className="mono-label text-graphite/70">FPS <b className="ml-0.5 font-mono text-sm text-vermilion-300">{stats.fps}</b></span>
        <span className="mono-label text-graphite/70">Render <b className="ml-0.5 font-mono text-sm text-vermilion-300">{stats.ms < 0 ? "—" : `${stats.ms}ms`}</b></span>
        <span className="mono-label text-graphite/70">Res <b className="ml-0.5 font-mono text-sm text-vermilion-300">{stats.width}×{stats.height}</b></span>
        <span className="mono-label text-graphite/70">Iter <b className="ml-0.5 font-mono text-sm text-vermilion-300">{iterations}</b></span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button className={btn} onClick={resetView}>Reset view</button>
        <button className={btn} onClick={exportJson}>Save config</button>
        <button className={btn} onClick={() => fileRef.current?.click()}>Load config</button>
        <button className={`${btn} bg-vermilion-500/15 text-vermilion-200 hover:bg-vermilion-500/25 hover:text-vermilion-100`} onClick={exportPng}>Export PNG</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
      </div>
    </header>
  );
}
