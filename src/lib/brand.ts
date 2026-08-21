/**
 * A deterministic gradient per entry, derived from its URL. The interface
 * chrome stays on the four color palette; the color on the page comes from the
 * entries themselves. An entry without a logo still reads as a brand rather
 * than a grey box, and the same URL always gets the same pair.
 */
const PAIRS: [string, string][] = [
  ["#3B5BDB", "#7C5CBF"],
  ["#0B7A4B", "#3FA57B"],
  ["#B23A2F", "#D8663A"],
  ["#15171A", "#5A6068"],
  ["#7C5CBF", "#B95FA8"],
  ["#D08A2E", "#E0B44A"],
  ["#1F7A8C", "#3FB0C4"],
  ["#8C3F5D", "#C2617E"],
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function brandGradient(url: string): string {
  const [from, to] = PAIRS[hash(url) % PAIRS.length];
  return `linear-gradient(140deg, ${from}, ${to})`;
}
