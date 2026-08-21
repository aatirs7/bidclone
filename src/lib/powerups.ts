/**
 * The catalog. Prices and durations live here so the server is the only thing
 * that decides what anything costs.
 */
export type PowerupKind =
  | "seat_lock"
  | "challenge"
  | "last_stand"
  | "spotlight";

export type PowerupSpec = {
  kind: PowerupKind;
  name: string;
  /** One line summary for the pill. The blurb is the full explanation. */
  tease: string;
  priceCents: number;
  /** Milliseconds the effect lasts. Zero means it has no clock. */
  durationMs: number;
  blurb: string;
  /** Only the entry currently holding the seat may buy it. */
  leaderOnly: boolean;
  needsTarget: boolean;
};

export const POWERUPS: Record<PowerupKind, PowerupSpec> = {
  seat_lock: {
    kind: "seat_lock",
    name: "Seat Lock",
    tease: "5 minutes nobody can pass you",
    priceCents: 500,
    durationMs: 5 * 60_000,
    blurb:
      "Five minutes where nobody can pass you. A countdown runs on the seat for everyone to watch.",
    leaderOnly: true,
    needsTarget: false,
  },
  challenge: {
    kind: "challenge",
    name: "Challenge",
    tease: "Call somebody out in public",
    priceCents: 200,
    durationMs: 24 * 3_600_000,
    blurb:
      "Name someone publicly. Their row carries your callout until you pass them or the day runs out.",
    leaderOnly: false,
    needsTarget: true,
  },
  last_stand: {
    kind: "last_stand",
    name: "Last Stand",
    tease: "Lose the seat, get it back",
    priceCents: 1_000,
    durationMs: 3_600_000,
    blurb:
      "Insurance. Lose the seat within the hour and this ten dollars is added to your total automatically.",
    leaderOnly: true,
    needsTarget: false,
  },
  spotlight: {
    kind: "spotlight",
    name: "Spotlight",
    tease: "An hour of being impossible to miss",
    priceCents: 300,
    durationMs: 3_600_000,
    blurb:
      "Your row is marked and lifted into the moving panel for an hour, wherever you sit.",
    leaderOnly: false,
    needsTarget: false,
  },
};

export const POWERUP_LIST = Object.values(POWERUPS);

export function isPowerupKind(value: unknown): value is PowerupKind {
  return typeof value === "string" && value in POWERUPS;
}
