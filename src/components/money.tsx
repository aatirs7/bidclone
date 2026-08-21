"use client";

import { useEffect, useRef, useState } from "react";

import { formatCents } from "@/lib/money";

const DURATION = 800;

/**
 * The new leader counts up to its total. Half of the signature moment, and the
 * reason totals are set in tabular figures: the digits must not shift while
 * they tick.
 */
export function Money({
  cents,
  animate = false,
}: {
  cents: number;
  animate?: boolean;
}) {
  const [shown, setShown] = useState(cents);
  const previous = useRef(cents);

  useEffect(() => {
    const from = previous.current;
    previous.current = cents;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate || reduced || from === cents) {
      setShown(cents);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // Ease out: fast off the mark, settles onto the number.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (cents - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [cents, animate]);

  return <>{formatCents(shown)}</>;
}
