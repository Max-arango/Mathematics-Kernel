import { useMemo, useState } from "react";
import { useStore, type AppMode } from "../store.ts";
import { useNotebook } from "../experiment/notebookStore.ts";
import { searchMath, type SearchEntry } from "../search/mathSearch.ts";
import { LogoMark } from "./Logo.tsx";

/**
 * Workspace launcher — the home screen. Desmos-style: no marketing, get to
 * work fast. A prominent search jumps straight to a tool, topic, or example;
 * below it, a clean list of workspaces labelled by what you actually do.
 */

type Glyph = () => React.ReactNode;

interface Workspace {
  id: Exclude<AppMode, "home">;
  name: string;
  blurb: string;
  glyph: Glyph;
}

const V = "#e0673d";
function G({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="size-9 text-ink/70" aria-hidden="true">
      {children}
    </svg>
  );
}

const WORKSPACES: Workspace[] = [
  {
    id: "calculator",
    name: "Calculator",
    blurb: "Plot 2D & 3D functions.",
    glyph: () => (
      <G>
        <line x1="10" y1="54" x2="54" y2="54" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <line x1="10" y1="10" x2="10" y2="54" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <path d="M10 46 C 22 46, 24 16, 34 16 S 46 50, 56 20" stroke={V} strokeWidth="2.5" strokeLinecap="round" />
      </G>
    ),
  },
  {
    id: "fractal",
    name: "Fractal Lab",
    blurb: "Zoom the Mandelbrot & Julia sets.",
    glyph: () => (
      <G>
        <path
          d="M40 32 C 40 24, 30 22, 26 28 C 22 22, 12 24, 14 34 C 12 40, 20 46, 26 42 C 32 48, 44 44, 40 32 Z"
          stroke={V}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="46" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <circle cx="50" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </G>
    ),
  },
  {
    id: "bloch",
    name: "Bloch Sphere",
    blurb: "Qubit states, gates & pulses.",
    glyph: () => (
      <G>
        <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="32" cy="32" rx="20" ry="7" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <line x1="32" y1="32" x2="46" y2="18" stroke={V} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="46" cy="18" r="3" fill={V} />
      </G>
    ),
  },
  {
    id: "fourd",
    name: "4D Geometry",
    blurb: "Rotate tesseracts & polytopes.",
    glyph: () => (
      <G>
        <rect x="14" y="14" width="24" height="24" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <rect x="26" y="26" width="24" height="24" stroke={V} strokeWidth="2.5" />
        <line x1="14" y1="14" x2="26" y2="26" stroke="currentColor" strokeWidth="1.25" opacity="0.4" />
        <line x1="38" y1="14" x2="50" y2="26" stroke="currentColor" strokeWidth="1.25" opacity="0.4" />
        <line x1="14" y1="38" x2="26" y2="50" stroke="currentColor" strokeWidth="1.25" opacity="0.4" />
        <line x1="38" y1="38" x2="50" y2="50" stroke="currentColor" strokeWidth="1.25" opacity="0.4" />
      </G>
    ),
  },
  {
    id: "topo",
    name: "Topology",
    blurb: "Morph surfaces, read invariants.",
    glyph: () => (
      <G>
        <ellipse cx="32" cy="32" rx="22" ry="14" stroke={V} strokeWidth="2.5" />
        <path d="M22 30 C 27 36, 37 36, 42 30" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <path d="M24 32.5 C 28 29, 36 29, 40 32.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      </G>
    ),
  },
  {
    id: "dynamics",
    name: "Dynamics",
    blurb: "Phase portraits & stability.",
    glyph: () => (
      <G>
        <path
          d="M32 32 C 40 30, 42 40, 34 42 C 24 44, 22 30, 32 26 C 46 20, 50 42, 36 50"
          stroke={V}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="32" r="2.5" fill="currentColor" />
        <path d="M36 50 l -1 -5 l 5 2 Z" fill={V} />
      </G>
    ),
  },
  {
    id: "dynamics3d",
    name: "Dynamics 3D",
    blurb: "Gravity, orbits & spacetime.",
    glyph: () => (
      <G>
        <ellipse cx="32" cy="32" rx="22" ry="9" stroke="currentColor" strokeWidth="1.5" opacity="0.5" transform="rotate(-20 32 32)" />
        <circle cx="32" cy="32" r="6" fill={V} />
        <circle cx="12" cy="38" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="52" cy="26" r="2.5" fill="currentColor" opacity="0.8" />
      </G>
    ),
  },
  {
    id: "inspector",
    name: "Inspector",
    blurb: "Analyze any object.",
    glyph: () => (
      <G>
        <circle cx="28" cy="28" r="15" stroke={V} strokeWidth="2.5" />
        <line x1="39" y1="39" x2="52" y2="52" stroke={V} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="28" x2="34" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <line x1="28" y1="22" x2="28" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      </G>
    ),
  },
  {
    id: "notebook",
    name: "Notebook",
    blurb: "Reproducible experiments.",
    glyph: () => (
      <G>
        <rect x="14" y="12" width="36" height="40" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="21" y1="22" x2="43" y2="22" stroke={V} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="21" y1="30" x2="37" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <line x1="21" y1="38" x2="40" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <line x1="21" y1="46" x2="30" y2="46" stroke={V} strokeWidth="2.5" strokeLinecap="round" />
      </G>
    ),
  },
  {
    id: "docs",
    name: "Documentation",
    blurb: "The math behind it all.",
    glyph: () => (
      <G>
        <path d="M32 16 C 26 12, 16 12, 14 14 L 14 48 C 16 46, 26 46, 32 50" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
        <path d="M32 16 C 38 12, 48 12, 50 14 L 50 48 C 48 46, 38 46, 32 50" stroke={V} strokeWidth="2.5" />
      </G>
    ),
  },
];

const KIND_LABEL: Record<SearchEntry["kind"], string> = {
  workspace: "tool",
  doc: "doc",
  capability: "cap",
  example: "ex",
};

export function HomeView() {
  const setAppMode = useStore((s) => s.setAppMode);
  const loadExample = useNotebook((s) => s.loadExample);
  const [query, setQuery] = useState("");
  const hits = useMemo(() => (query.trim() ? searchMath(query).slice(0, 7) : []), [query]);

  const go = (e: SearchEntry) => {
    setQuery("");
    if (e.kind === "workspace") {
      setAppMode(e.route as AppMode);
    } else if (e.kind === "doc") {
      setAppMode("docs");
      setTimeout(() => document.getElementById(`doc-${e.route}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } else if (e.kind === "example") {
      setAppMode("notebook");
      setTimeout(() => loadExample(e.route), 0);
    } else {
      setAppMode("inspector");
    }
  };

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-void">
      <div className="mx-auto flex min-h-full max-w-4xl flex-col px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 pt-8 text-ink">
          <LogoMark className="size-6" />
          <span className="font-display text-lg leading-none tracking-tight">
            Mathematics <em className="text-vermilion-400">Simulator</em>
          </span>
        </div>

        {/* Direct prompt + search */}
        <div className="fade-up relative z-30 pt-12 sm:pt-16">
          <h1 className="font-display text-3xl leading-tight tracking-tight text-ink sm:text-[2.5rem]">
            What do you want to explore?
          </h1>
          <div className="relative mt-5">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-graphite">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && hits[0] && go(hits[0])}
              placeholder="Search a tool, topic, or example — try “Lorenz”, “eigenvalue”, “Mandelbrot”"
              className="w-full rounded-xl border border-line bg-void-soft py-3.5 pl-12 pr-4 text-base text-ink outline-none transition placeholder:text-graphite/60 focus:border-vermilion-400/50 focus:ring-2 focus:ring-vermilion-400/20"
            />
            {query.trim() && (
              <div className="scroll-thin absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-line bg-void-soft p-1.5 shadow-[0_16px_44px_-16px_rgba(0,0,0,0.8)]">
                {hits.length === 0 && <div className="px-3 py-3 text-sm text-graphite">No matches for “{query}”.</div>}
                {hits.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => go(h)}
                    className="focusable flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink transition hover:bg-vermilion-500/10"
                  >
                    <span className="mono-label shrink-0 rounded-sm bg-white/5 px-1.5 py-0.5 text-[9px] text-graphite/70">
                      {KIND_LABEL[h.kind]}
                    </span>
                    <span className="truncate">{h.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tools */}
        <p className="mono-label mt-12 mb-3 text-graphite">All workspaces</p>
        <div className="relative z-0 grid gap-3 pb-14 sm:grid-cols-2">
          {WORKSPACES.map((ws, i) => (
            <button
              key={ws.id}
              onClick={() => setAppMode(ws.id)}
              style={{ animationDelay: `${60 + i * 30}ms` }}
              className="fade-up group focusable flex items-center gap-4 rounded-xl border border-line bg-void-soft p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-vermilion-400/40 hover:bg-vermilion-500/[0.05]"
            >
              <span className="graph-paper flex size-14 shrink-0 items-center justify-center rounded-lg border border-line bg-void transition-transform duration-300 group-hover:scale-105">
                {ws.glyph()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight tracking-tight text-ink">{ws.name}</span>
                <span className="block truncate text-sm text-graphite">{ws.blurb}</span>
              </span>
              <span aria-hidden className="shrink-0 pr-1 text-graphite/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-vermilion-300">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
