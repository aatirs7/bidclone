import { cookies } from "next/headers";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { ADMIN_COOKIE, isAdmin } from "@/lib/admin";
import { HideToggle } from "@/components/hide-toggle";
import { formatCents, formatCount } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Middleware has already moved the key out of the URL and into an httpOnly
  // cookie. This is the check that actually gates the data.
  const jar = await cookies();

  if (!isAdmin(jar.get(ADMIN_COOKIE)?.value)) {
    return (
      <main className="mx-auto max-w-[680px] px-5 py-20">
        <h1 className="text-[17px] font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Append the admin key as a query parameter.
        </p>
      </main>
    );
  }

  const rows = await db
    .select()
    .from(entries)
    .orderBy(desc(entries.totalCents));

  return (
    <main className="mx-auto max-w-[940px] px-5 py-10">
      <h1 className="mb-1 text-[22px] font-semibold tracking-[-0.02em]">
        Moderation
      </h1>
      <p className="mb-6 text-[13px] text-ink-faint">
        Hidden entries keep their total and stop rendering. Hiding does not
        refund.
      </p>

      <div className="overflow-x-auto rounded-xl border border-rule bg-panel">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-rule text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-semibold">Entry</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Clicks</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-ink-faint">
                  No entries yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.displayName}</div>
                    <div className="num text-[12px] text-ink-faint">
                      {row.url}
                    </div>
                  </td>
                  <td className="num px-4 py-3 font-semibold">
                    {formatCents(row.totalCents)}
                  </td>
                  <td className="num px-4 py-3">
                    {formatCount(row.clickCount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.status === "active" ? "text-gain" : "text-drop"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <HideToggle id={row.id} hidden={row.status === "hidden"} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
