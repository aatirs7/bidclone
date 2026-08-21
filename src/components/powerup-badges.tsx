import { POWERUPS, isPowerupKind } from "@/lib/powerups";
import { PowerupIcon } from "./powerup-icon";

/**
 * An entry showing what it has bought. The point of a power-up is that it is
 * public, so it has to be legible on the row itself.
 */
export function PowerupBadges({
  kinds,
  className = "",
}: {
  kinds: string[];
  className?: string;
}) {
  const active = (Array.isArray(kinds) ? kinds : []).filter(isPowerupKind);
  if (active.length === 0) return null;

  return (
    <span className={`flex flex-wrap items-center gap-1 ${className}`}>
      {active.map((kind) => (
        <span
          key={kind}
          title={POWERUPS[kind].blurb}
          className="flex items-center gap-[4px] rounded-full border border-gain/35 bg-gain-wash px-[7px] py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gain"
        >
          <PowerupIcon kind={kind} size={11} />
          {POWERUPS[kind].name}
        </span>
      ))}
    </span>
  );
}
