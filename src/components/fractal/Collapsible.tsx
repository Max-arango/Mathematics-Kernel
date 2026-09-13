import { useState, type ReactNode } from "react";

/** A collapsible section for the floating fractal panel. */
export function Collapsible({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line/70 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="focusable flex w-full items-center gap-2 px-4 py-2.5 text-left transition hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="text-vermilion-300/90">{icon}</span>
        <span className="mono-label text-vermilion-300/90">{title}</span>
        <span className={`ml-auto text-sm text-graphite/60 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>
      <div className={open ? "px-4 pb-4" : "hidden"}>{children}</div>
    </div>
  );
}
