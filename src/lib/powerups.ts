/**
 * The catalog. Prices and durations live here so the server is the only thing
 * that decides what anything costs.
 */
export type PowerupKind =
  | "seat_lock"
  | "challenge"
  | "last_stand"
  | "spotlight"
  | "smoke_screen"
  | "siege";

export type PowerupSpec = {
  kind: PowerupKind;
  name: string;
  /**
   * Power-ups are the one part of the site allowed to carry colour. The board
   * stays institutional; the game layer gets to look like a game.
   */
  accent: string;
  /** Two stop gradient for washes and glows. */
  accentTo: string;
  /** Short shout for promos and popups. */
  hook: string;
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
    accent: "#C98A1B",
    accentTo: "#E0B44A",
    hook: "Freeze the board",
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
    accent: "#C0392B",
    accentTo: "#E0654F",
    hook: "Name your target",
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
    accent: "#2E6BC6",
    accentTo: "#5B9BE8",
    hook: "Never lose it quietly",
    tease: "Lose the seat, get it back",
    priceCents: 1_000,
    durationMs: 3_600_000,
    blurb:
      "Insurance. Lose the seat within the hour and this ten dollars is added to your total automatically.",
    leaderOnly: true,
    needsTarget: false,
  },
  // Two that change what the board itself shows, rather than decorating a row.
  // Visible to everyone, which is the only kind of advantage worth selling on
  // a page whose whole pitch is that you can see what people bought.
  smoke_screen: {
    kind: "smoke_screen",
    accent: "#4A5568",
    accentTo: "#8494A8",
    hook: "Hide your number",
    priceCents: 400,
    durationMs: 3_600_000,
    name: "Smoke Screen",
    tease: "Nobody can see what you paid",
    blurb:
      "Your total shows as hidden for an hour. Everyone can see you are there, nobody can see what it costs to pass you.",
    leaderOnly: false,
    needsTarget: false,
  },
  siege: {
    kind: "siege",
    accent: "#1F7A6F",
    accentTo: "#3FB5A5",
    hook: "Make them pay double",
    priceCents: 900,
    durationMs: 3_600_000,
    name: "Siege",
    tease: "Doubles the cost of passing you",
    blurb:
      "For one hour, taking your seat costs twice the usual margin. The board shows the higher price to everyone.",
    leaderOnly: false,
    needsTarget: false,
  },
  spotlight: {
    kind: "spotlight",
    name: "Spotlight",
    accent: "#7C5CBF",
    accentTo: "#A98BE0",
    hook: "Impossible to miss",
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
