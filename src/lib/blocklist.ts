/**
 * Checked at checkout creation and again at webhook time. Within an hour of any
 * traction someone will bid a porn link, a scam, or a slur, so this ships on day
 * one. Populate it further before launch; it is deliberately a plain list so
 * that adding an entry is a one-line edit and a redeploy.
 */
export const BLOCKED_DOMAINS: string[] = [
  "pornhub.com",
  "xvideos.com",
  "xhamster.com",
  "onlyfans.com",
  "chaturbate.com",
  "redtube.com",
  "xnxx.com",
  "stripchat.com",
  "kink.com",
  "brazzers.com",
  "8kun.top",
  "kiwifarms.net",
  "stormfront.org",
  "dailystormer.com",
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "grabify.link",
  "iplogger.org",
  "localhost",
];

export const BLOCKED_SUBSTRINGS: string[] = [
  "porn",
  "xxx",
  "nsfw",
  "hentai",
  "escort",
  "camgirl",
  "onlyfans",
  "sexcam",
  "nigger",
  "faggot",
  "kike",
  "tranny",
  "retard",
  "rape",
  "childporn",
  "cp-",
  "loli",
  "freecrypto",
  "airdrop",
  "metamask-",
  "wallet-connect",
  "seedphrase",
  "double-your",
  "get-rich",
];

/** `url` must already be normalized. Domain match includes subdomains. */
export function isBlocked(url: string): boolean {
  const host = url.split("/")[0];

  for (const domain of BLOCKED_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return true;
  }
  for (const needle of BLOCKED_SUBSTRINGS) {
    if (url.includes(needle)) return true;
  }
  return false;
}
