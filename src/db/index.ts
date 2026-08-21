import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

import * as schema from "./schema";

// Neon speaks Postgres over WebSockets outside the browser. This is what buys us
// real interactive transactions, which the HTTP driver cannot do.
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

declare global {
  var __dethroneDb: NeonDatabase<typeof schema> | undefined;
}

function connect(): NeonDatabase<typeof schema> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  // Reused across hot reloads in dev and warm invocations in prod. Must be the
  // POOLED Neon string (host contains "-pooler"), otherwise a traffic spike
  // exhausts connections and takes the site down at the worst possible moment.
  globalThis.__dethroneDb ??= drizzle(
    new Pool({ connectionString: process.env.DATABASE_URL }),
    { schema },
  );
  return globalThis.__dethroneDb;
}

// Lazy: connecting at import time would fail the build when env is absent.
export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get: (_t, prop) => {
    const real = connect();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
