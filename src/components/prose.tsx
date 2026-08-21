export function Prose({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[680px] px-5 py-14">
      <h1 className="mb-6 text-[26px] font-semibold tracking-[-0.03em]">
        {title}
      </h1>
      <div className="space-y-5 text-[15px] leading-[1.6] text-ink-soft">
        {children}
      </div>
    </main>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <p>
      <b className="font-semibold text-ink">{title}</b> {children}
    </p>
  );
}

export function Rule() {
  return <hr className="border-0 border-t border-rule" />;
}
