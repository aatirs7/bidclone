import { ImageResponse } from "next/og";

import { getBoardSafe } from "@/lib/leaderboard";
import { formatCents, formatCount } from "@/lib/money";
import { formatDuration } from "@/lib/time";

export const runtime = "nodejs";
export const alt = "cheapseat.lol";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Every share becomes an ad for the current state of the board, without
// regenerating the image on every crawl.
export const revalidate = 60;

const GROUND = "#F3F4F1";
const PANEL = "#FFFFFF";
const INK = "#15171A";
const INK_SOFT = "#5A6068";
const INK_FAINT = "#9AA0A6";
const RULE = "#E2E4DF";
const GAIN = "#0B7A4B";

export default async function Image() {
  const board = await getBoardSafe();
  const leader = board.rows[0];
  const chasers = board.rows.slice(1, 4);

  const held = leader?.reignStartedAt
    ? formatDuration(
        (Date.now() - new Date(leader.reignStartedAt).getTime()) / 1000,
      )
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: GROUND,
          color: INK,
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: INK_SOFT,
          }}
        >
          <span style={{ color: INK, fontWeight: 700 }}>cheapseat.lol</span>
          <span>The seat is bought, not earned</span>
        </div>

        {leader ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 40,
              padding: "36px 40px",
              background: PANEL,
              border: `2px solid ${GAIN}`,
              borderRadius: 20,
            }}
          >
            <div style={{ display: "flex", fontSize: 22, color: INK_FAINT }}>
              01
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 60,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginTop: 4,
              }}
            >
              {leader.displayName.slice(0, 26)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 28,
                marginTop: 18,
              }}
            >
              <span style={{ fontSize: 76, fontWeight: 700, color: GAIN }}>
                {formatCents(leader.totalCents)}
              </span>
              <span style={{ fontSize: 26, color: INK_SOFT }}>
                {formatCount(leader.clickCount)} clicks
              </span>
              {held ? (
                <span style={{ fontSize: 26, color: INK_SOFT }}>
                  holding {held}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              marginTop: 60,
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            The seat is empty. First to pay $1 takes it.
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            gap: 10,
          }}
        >
          {chasers.map((row, i) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 26,
                color: INK_SOFT,
                borderBottom: `1px solid ${RULE}`,
                paddingBottom: 10,
              }}
            >
              <span>
                {String(i + 2).padStart(2, "0")}
                {"  "}
                {row.displayName.slice(0, 30)}
              </span>
              <span style={{ color: INK, fontWeight: 600 }}>
                {formatCents(row.totalCents)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div style={{ display: "flex", fontSize: 24, color: INK_SOFT }}>
          {formatCents(board.stats.paidToDateCents)} paid to date across{" "}
          {formatCount(board.stats.entryCount)} entries. Every bid stays on your
          name.
        </div>
      </div>
    ),
    size,
  );
}
