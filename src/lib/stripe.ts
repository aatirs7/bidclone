import Stripe from "stripe";

let client: Stripe | undefined;

/** Lazy so that a missing key fails the request, not the build. */
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
  });
  return client;
}

export { appUrl } from "./app-url";
