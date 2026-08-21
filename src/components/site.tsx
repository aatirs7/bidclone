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
        <nav className="flex items-center gap-5 text-sm sm:gap-[22px]">
          <Link href="/#board" className="text-ink-soft transition-colors hover:text-ink">
            Board
          </Link>
          <Link href="/rules" className="text-ink-soft transition-colors hover:text-ink">
            Rules
          </Link>
          <Link href="/wall" className="text-ink-soft transition-colors hover:text-ink">
            Wall
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
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
