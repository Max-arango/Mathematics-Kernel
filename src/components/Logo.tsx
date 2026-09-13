/**
 * Plot-mark logo: a framed sine curve over faint axes, with a vermilion trace.
 * Adapted from the Mathematics-Landing design system. The frame/axes follow
 * `currentColor`; the curve stays vermilion.
 */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none">
      <rect x="1.25" y="1.25" width="29.5" height="29.5" rx="7" strokeWidth="1.5" stroke="currentColor" />
      <line x1="8" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="8" y1="8" x2="8" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path
        d="M8 19.5 C 10.5 19.5, 11 11, 14 11 S 16.5 24, 19.5 24 S 23 14, 26 14"
        stroke="#e0673d"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
