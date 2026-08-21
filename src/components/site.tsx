import Link from "next/link";

export function Masthead() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex h-15 max-w-[940px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-[9px] text-base font-semibold tracking-[-0.02em]">
          <span className="flex h-5 w-5 flex-col justify-center gap-[2.5px] rounded-[3px] bg-ink px-1">
            <i className="block h-[2px] w-full rounded-[1px] bg-ground" />
            <i className="block h-[2px] w-[65%] rounded-[1px] bg-ground" />
            <i className="block h-[2px] w-[35%] rounded-[1px] bg-ground" />
          </span>
          dethrone<span className="font-normal text-ink-faint">.lol</span>
        </Link>
        <nav className="flex gap-[22px] text-sm">
          <Link href="/#board" className="text-ink-soft transition-colors hover:text-ink">
            Board
          </Link>
          <Link href="/rules" className="text-ink-soft transition-colors hover:text-ink">
            Rules
          </Link>
          <Link href="/#reigns" className="text-ink-soft transition-colors hover:text-ink">
            Reigns
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const report = process.env.NEXT_PUBLIC_REPORT_EMAIL ?? "reports@dethrone.lol";
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
          href={`mailto:${report}?subject=${encodeURIComponent("Report an entry on dethrone.lol")}`}
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
