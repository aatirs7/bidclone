import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";

export function Masthead() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[940px] flex-col items-center gap-2 px-5 py-3 sm:h-15 sm:flex-row sm:justify-between sm:gap-0 sm:py-0">
        <Link href="/" className="flex items-center gap-[9px] text-base font-semibold tracking-[-0.02em]">
          {/* The mark is drawn on a light ground, so it sits on an explicit
              tile. Deliberate in both themes rather than a stray light square. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 flex-none rounded-[6px] bg-[#eceee9] object-contain p-[2px] ring-1 ring-ink/10"
          />
          cheapseat<span className="font-normal text-ink-faint">.lol</span>
        </Link>
        <nav className="relative flex items-center gap-5 text-sm sm:gap-[22px]">
          <Link href="/#board" className="text-ink-soft transition-colors hover:text-ink">
            Board
          </Link>
          <Link href="/rules" className="text-ink-soft transition-colors hover:text-ink">
            Rules
          </Link>
          <span className="relative">
            <Link
              href="/wall"
              className="text-ink-soft transition-colors hover:text-ink"
            >
              Wall
            </Link>
            <WallNote />
          </span>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

/**
 * A margin note, in the one handwritten face on the site. The interface stays
 * straight faced, so the aside is allowed to be the thing that is not.
 */
function WallNote() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-full hidden select-none items-start lg:flex"
    >
      <svg
        width="52"
        height="44"
        viewBox="0 0 52 44"
        fill="none"
        className="-ml-[10px] mt-[6px] flex-none text-ink-faint"
      >
        {/* Curves up from the text and lands under the Wall link. */}
        <path
          d="M7 6c0 13 3 21 18 27 8 3 18 4 25 4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M2 13 7 4l6 8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="mt-[26px] block whitespace-nowrap text-[20px] leading-[1.1] text-ink-soft"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        first seat lives on
        <br />
        the wall forever
      </span>
    </span>
  );
}

export function Footer() {
  const report = process.env.NEXT_PUBLIC_REPORT_EMAIL ?? "reports@cheapseat.lol";
  return (
    <footer className="mt-14 border-t border-rule py-[26px] pb-11 text-center text-[12.5px] text-ink-faint">
      <div className="mx-auto max-w-[940px] px-5">
        <Link href="/rules" className="mx-[9px] text-ink-soft no-underline hover:text-ink">
          Rules
        </Link>
        <Link href="/terms" className="mx-[9px] text-ink-soft no-underline hover:text-ink">
          Terms
        </Link>
        <a
          href={`mailto:${report}?subject=${encodeURIComponent("Report an entry on cheapseat.lol")}`}
          className="mx-[9px] text-ink-soft no-underline hover:text-ink"
        >
          Report an entry
        </a>
        <p className="mt-3">
          Every listing is paid. Nothing here is a recommendation. Click counts
          are real.
        </p>
      </div>
    </footer>
  );
}
