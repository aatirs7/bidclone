"use client";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/time";

/**
 * The ticking number on the seat. This is what makes the top spot feel
 * occupied rather than merely expensive, so it updates every second even
 * though nothing else on the page does.
 */
export function ReignClock({ since }: { since: string }) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000)),
  );

  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () =>
      setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);

  return <span className="num">holding {formatDuration(seconds)}</span>;
}
