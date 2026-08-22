import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { brandGradient } from "@/lib/brand";
import { getBoardSafe, type BoardRow } from "@/lib/leaderboard";
import { MIN_BID_CENTS, formatCents } from "@/lib/money";
import { POWERUP_LIST } from "@/lib/powerups";

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
const GAIN = "#0B7A4B";

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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: GROUND,
          color: INK,
          padding: "40px 56px",
          fontFamily: "Instrument Sans",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "baseline", fontSize: 24 }}
        >
          <span style={{ fontWeight: 600 }}>cheapseat</span>
          <span style={{ color: INK_FAINT }}>.lol</span>
        </div>

        {/* The card renders small in a feed, so one number has to carry it. */}
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 26,
            letterSpacing: 3,
            fontWeight: 600,
            color: INK_SOFT,
          }}
        >
          GET ON THE BOARD FROM
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "IBM Plex Mono",
            fontSize: 116,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: GAIN,
            marginTop: 6,
          }}
        >
          {formatCents(MIN_BID_CENTS)}
        </div>

        {leader ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 26,
              padding: "14px 28px",
              background: PANEL,
              border: `2px solid ${GAIN}`,
              borderRadius: 999,
            }}
          >
            {mark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mark}
                alt=""
                width={46}
                height={46}
                style={{ borderRadius: 12, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: brandGradient(leader.url),
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {leader.displayName.replace(/^@/, "").charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>
              {leader.displayName.slice(0, 22)}
            </span>
            <span style={{ display: "flex", fontSize: 26, color: INK_FAINT }}>
              holds it at
            </span>
            <span
              style={{
                display: "flex",
                fontFamily: "IBM Plex Mono",
                fontSize: 32,
                color: GAIN,
              }}
            >
              {formatCents(leader.totalCents)}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 26, fontSize: 30 }}>
            The seat is empty. Nobody has paid anything yet.
          </div>
        )}

        <div
          style={{
            display: "flex",
            marginTop: 18,
            padding: "12px 32px",
            borderRadius: 999,
            background: INK,
            color: GROUND,
            fontSize: 25,
            fontWeight: 600,
          }}
        >
          {`Take the top seat for ${formatCents(board.seatPriceCents)}`}
        </div>

        <div
          style={{
            display: "flex",
            gap: 30,
            marginTop: 18,
            fontSize: 25,
            color: INK_SOFT,
          }}
        >
          {chasers.map((row, i) => (
            <span key={row.id} style={{ display: "flex", gap: 9 }}>
              <span style={{ fontFamily: "IBM Plex Mono", color: INK_FAINT }}>
                {String(i + 2).padStart(2, "0")}
              </span>
              <span>{row.displayName.slice(0, 18)}</span>
              <span style={{ fontFamily: "IBM Plex Mono", color: INK }}>
                {formatCents(row.totalCents)}
              </span>
            </span>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 26,
          }}
        >
          {POWERUP_LIST.slice(0, 5).map((p) => (
            <span
              key={p.kind}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: 999,
                background: `${p.accent}1A`,
                border: `1px solid ${p.accent}66`,
                fontSize: 18,
                color: INK,
              }}
            >
              <span
                style={{
                  display: "flex",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: p.accent,
                }}
              />
              {p.name}
              <span
                style={{
                  fontFamily: "IBM Plex Mono",
                  color: p.accent,
                }}
              >
                {formatCents(p.priceCents)}
              </span>
            </span>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 18,
            fontSize: 21,
            color: INK_FAINT,
          }}
        >
          <span>Power-ups</span>
          <span>&middot;</span>
          <span>Bids stack</span>
          <span>&middot;</span>
          <span>Clicks are public</span>
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
