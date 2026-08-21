import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { brandGradient } from "@/lib/brand";
import { getBoardSafe, type BoardRow } from "@/lib/leaderboard";
import { formatCents, formatCount } from "@/lib/money";
import { formatDuration } from "@/lib/time";

export const runtime = "nodejs";
export const alt = "cheapseat.lol";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Every share is an ad for the current state of the board, without
// regenerating the image on every crawl.
export const revalidate = 60;

// The site palette and the site fonts. A share card that looks like a
// different product is worse than no card at all.
const GROUND = "#E8EAE6";
const PANEL = "#F6F7F4";
const INK = "#15171A";
const INK_SOFT = "#5A6068";
const INK_FAINT = "#9AA0A6";
const RULE = "#CBCEC7";
const GAIN = "#0B7A4B";
const GAIN_WASH = "#DFEAE4";

function font(file: string) {
  return readFile(path.join(process.cwd(), "src/assets/fonts", file));
}

/**
 * The leader's own mark, inlined so the renderer never reaches the network
 * mid render. A slow or dead icon host would otherwise fail the whole image.
 */
async function markDataUri(row: BoardRow): Promise<string | null> {
  const src = row.logoUrl ?? row.faviconUrl;
  if (!src) return null;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(2_000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    // SVG is not reliably rasterised here, and a huge file is not worth it.
    if (!type.startsWith("image/") || type.includes("svg")) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 400_000) return null;
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image() {
  const board = await getBoardSafe();
  const leader = board.rows[0];
  const chasers = board.rows.slice(1, 4);

  const [regular, semibold, mono, mark] = await Promise.all([
    font("InstrumentSans-Regular.ttf"),
    font("InstrumentSans-SemiBold.ttf"),
    font("IBMPlexMono-SemiBold.ttf"),
    leader ? markDataUri(leader) : Promise.resolve(null),
  ]);

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
          padding: "36px 46px",
          fontFamily: "Instrument Sans",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 21,
            color: INK_SOFT,
          }}
        >
          <span style={{ display: "flex", alignItems: "baseline", color: INK }}>
            <span style={{ fontWeight: 600 }}>cheapseat</span>
            <span style={{ color: INK_FAINT }}>.lol</span>
          </span>
          <span>The seat is bought, not earned</span>
        </div>

        {leader ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 24,
              padding: "24px 28px",
              background: PANEL,
              border: `2px solid ${GAIN}`,
              borderRadius: 20,
            }}
          >
            {mark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mark}
                alt=""
                width={100}
                height={100}
                style={{ borderRadius: 18, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 100,
                  height: 100,
                  borderRadius: 18,
                  background: brandGradient(leader.url),
                  color: "#FFFFFF",
                  fontSize: 44,
                  fontWeight: 600,
                }}
              >
                {leader.displayName.replace(/^@/, "").charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    display: "flex",
                    padding: "2px 11px",
                    borderRadius: 999,
                    background: GAIN,
                    color: "#FFFFFF",
                    fontFamily: "IBM Plex Mono",
                    fontSize: 17,
                  }}
                >
                  01
                </span>
                <span
                  style={{
                    fontSize: 15,
                    letterSpacing: 2,
                    color: GAIN,
                    fontWeight: 600,
                  }}
                >
                  HOLDS THE SEAT
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  marginTop: 6,
                }}
              >
                {leader.displayName.slice(0, 24)}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 20,
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "IBM Plex Mono",
                    fontSize: 50,
                    color: GAIN,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {formatCents(leader.totalCents)}
                </span>
                <span style={{ fontSize: 20, color: INK_SOFT }}>
                  {formatCount(leader.clickCount)} clicks
                </span>
                {held ? (
                  <span style={{ fontSize: 20, color: INK_SOFT }}>
                    holding {held}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "13px 20px",
                borderRadius: 14,
                background: GAIN_WASH,
                border: `1px solid ${GAIN}`,
              }}
            >
              <span
                style={{ fontSize: 13, letterSpacing: 1.6, color: INK_SOFT }}
              >
                TAKE IT FOR
              </span>
              <span
                style={{
                  fontFamily: "IBM Plex Mono",
                  fontSize: 32,
                  color: GAIN,
                  marginTop: 2,
                }}
              >
                {formatCents(board.seatPriceCents)}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              marginTop: 56,
              fontSize: 56,
              fontWeight: 600,
              letterSpacing: "-0.03em",
            }}
          >
            The seat is empty. Be number one here for $1.
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 16,
          }}
        >
          {chasers.map((row, i) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 23,
                color: INK_SOFT,
                borderBottom: `1px solid ${RULE}`,
                padding: "8px 4px",
              }}
            >
              <span style={{ display: "flex", gap: 14 }}>
                <span style={{ fontFamily: "IBM Plex Mono", color: INK_FAINT }}>
                  {String(i + 2).padStart(2, "0")}
                </span>
                <span>{row.displayName.slice(0, 30)}</span>
              </span>
              <span style={{ fontFamily: "IBM Plex Mono", color: INK }}>
                {formatCents(row.totalCents)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            color: INK_SOFT,
          }}
        >
          <span>New seats start at $1. Every bid stays on your name.</span>
          <span style={{ fontFamily: "IBM Plex Mono", color: INK }}>
            {formatCents(board.stats.paidToDateCents)} paid to date
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Sans", data: regular, weight: 400, style: "normal" },
        {
          name: "Instrument Sans",
          data: semibold,
          weight: 600,
          style: "normal",
        },
        { name: "IBM Plex Mono", data: mono, weight: 600, style: "normal" },
      ],
    },
  );
}
