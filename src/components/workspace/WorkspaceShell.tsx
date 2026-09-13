import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "../Logo.tsx";

const EYE = (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
    <path d="M2 12 C 5 6, 19 6, 22 12 C 19 18, 5 18, 2 12 Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const EYE_OFF = (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
    <path d="M2 12 C 5 6, 19 6, 22 12 C 19 18, 5 18, 2 12 Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const iconBtn =
  "focusable flex size-8 items-center justify-center rounded-md text-[15px] text-graphite transition hover:bg-white/10 hover:text-ink";

/**
 * Shared "creative tool" shell for a simulation workspace: a full-bleed
 * canvas ({children}) with floating glass chrome — a top toolbar, a collapsible
 * left control panel, an optional HUD, and a hide-all-UI toggle (button or "H",
 * "Esc" to restore).
 */
export function WorkspaceShell({
  title,
  panel,
  children,
  panelWidth = 300,
  toolbarActions,
  hud,
}: {
  title: string;
  panel: ReactNode;
  children: ReactNode;
  panelWidth?: number;
  toolbarActions?: ReactNode;
  hud?: ReactNode;
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [uiHidden, setUiHidden] = useState(false);

  // "H" toggles all overlays; "Esc" restores them. Ignore while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (el?.isContentEditable) return;
      if (e.key === "h" || e.key === "H") setUiHidden((v) => !v);
      else if (e.key === "Escape") setUiHidden(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div className="absolute inset-0">{children}</div>

      {uiHidden ? (
        <button
          onClick={() => setUiHidden(false)}
          title="Show UI (H)"
          aria-label="Show UI"
          className="focusable absolute right-3 top-3 z-30 flex size-9 items-center justify-center rounded-lg border border-line bg-void-soft/70 text-graphite shadow-lg backdrop-blur-md transition hover:border-vermilion-400/50 hover:text-vermilion-200"
        >
          {EYE}
        </button>
      ) : (
        <>
          <div className="absolute inset-x-3 top-3 z-20 flex h-12 items-center gap-3 rounded-xl border border-line bg-void-soft/80 px-2.5 shadow-lg backdrop-blur-xl">
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className={iconBtn}
              title={panelOpen ? "Hide controls" : "Show controls"}
              aria-label="Toggle controls"
            >
              {panelOpen ? "⟨" : "⟩"}
            </button>
            <span className="flex items-center gap-2 text-ink">
              <LogoMark className="size-5" />
            </span>
            <span className="h-5 w-px bg-line" aria-hidden />
            <span className="font-display text-lg leading-none tracking-tight text-ink">{title}</span>
            <div className="ml-auto flex items-center gap-1">
              {toolbarActions}
              <button className={iconBtn} onClick={() => setUiHidden(true)} title="Hide UI (H)" aria-label="Hide UI">
                {EYE_OFF}
              </button>
            </div>
          </div>

          {panelOpen && (
            <div className="absolute bottom-3 left-3 top-[68px] z-20" style={{ width: panelWidth }}>
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-void-soft/85 shadow-2xl backdrop-blur-xl">
                <div className="scroll-thin flex-1 overflow-y-auto">{panel}</div>
              </div>
            </div>
          )}

          {hud}
        </>
      )}
    </div>
  );
}
