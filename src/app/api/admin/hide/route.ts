import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { ADMIN_COOKIE, isAdmin } from "@/lib/admin";
import { settleSeat } from "@/lib/seat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Authorization is re-checked here. The page rendering is not the gate.
  const jar = await cookies();
  if (!isAdmin(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id, hidden } = (await req.json().catch(() => ({}))) as {
    id?: string;
    hidden?: boolean;
  };

  if (typeof id !== "string" || typeof hidden !== "boolean") {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(entries)
        .set({ status: hidden ? "hidden" : "active" })
        .where(eq(entries.id, id));
      // Hiding the leader has to pass the seat on immediately, otherwise the
      // clock keeps running on a row nobody can see.
      await settleSeat(tx);
    });
  } catch (error) {
    console.error("[admin] hide failed", id, error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
