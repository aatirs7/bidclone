import type { PowerupKind } from "@/lib/powerups";

/**
 * One set, one grid, one stroke weight. Four borrowed glyphs would read as
 * clip art; these are drawn to match each other.
 */
const PATHS: Record<PowerupKind, React.ReactNode> = {
  // A padlock over the seat.
  seat_lock: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </>
  ),
  // Crossed markers: a callout aimed at somebody.
  challenge: (
    <>
      <path d="M4 21V4l9 3 7-2v10l-7 2-9-3" />
      <path d="M4 12h9" />
    </>
  ),
  // A shield that catches you on the way down.
  last_stand: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
      <path d="M9 12l2.5 2.5L16 10" />
    </>
  ),
  // A beam widening onto the row.
  spotlight: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M9.6 6.9 4 19h16L14.4 6.9" />
      <path d="M8 15h8" />
    </>
  ),
};

export function PowerupIcon({
  kind,
  size = 15,
  className = "",
}: {
  kind: PowerupKind;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[kind]}
    </svg>
  );
}
