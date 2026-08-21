const WHOLE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const EXACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Money is the display face on this page, so whole dollars stay uncluttered. */
export function formatCents(cents: number): string {
  return cents % 100 === 0 ? WHOLE.format(cents / 100) : EXACT.format(cents / 100);
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export const MIN_BID_CENTS = 100;
export const MAX_BID_CENTS = 100_000;

/**
 * What it truly costs to pass the entry above you. Ties go to the incumbent, so
 * the challenger has to actually exceed. Rounded up to a whole dollar because
 * nobody wants to type $47.01.
 *
 * Deliberately NOT capped at MAX_BID_CENTS: that ceiling limits a single
 * payment, not the price of the seat. Capping here would post $1,000 next to a
 * leader sitting on $8,412, which is the one number on this page that has to be
 * right.
 */
export function costToPass(targetCents: number, yourCurrentCents = 0): number {
  const needed = targetCents - yourCurrentCents + 1;
  return Math.max(Math.ceil(needed / 100) * 100, MIN_BID_CENTS);
}
