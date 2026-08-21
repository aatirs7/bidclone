import assert from "node:assert/strict";
import { test } from "node:test";

import { isBlocked } from "./blocklist";
import { normalizeUrl } from "./normalize-url";
import { costToPass } from "./money";

test("collides the forms people actually paste", () => {
  const same = [
    "https://www.Foo.com/?ref=x",
    "foo.com",
    "FOO.com/",
    "http://foo.com#anchor",
    "  https://foo.com/  ",
    "https://WWW.FOO.COM/?a=1&b=2#top",
  ];
  for (const input of same) {
    assert.equal(normalizeUrl(input), "foo.com", `failed on ${input}`);
  }
});

test("keeps the path but drops query, fragment and trailing slash", () => {
  assert.equal(normalizeUrl("https://foo.com/Bar/?x=1#y"), "foo.com/bar");
  assert.equal(normalizeUrl("foo.com/bar/baz/"), "foo.com/bar/baz");
});

test("treats an @handle as an X profile", () => {
  assert.equal(normalizeUrl("@levelsio"), "x.com/levelsio");
  assert.equal(normalizeUrl("@LevelsIO"), "x.com/levelsio");
  assert.equal(normalizeUrl("@not a handle"), null);
  assert.equal(normalizeUrl("@"), null);
});

test("rejects what is not a public http url", () => {
  for (const bad of [
    "",
    "   ",
    "not a url",
    "javascript:alert(1)",
    "mailto:a@b.com",
    "ftp://foo.com",
    "localhost:3000",
    "http://127.0.0.1",
    "http://192.168.1.1/admin",
  ]) {
    assert.equal(normalizeUrl(bad), null, `should reject ${bad}`);
  }
});

test("blocklist matches domains, subdomains and substrings", () => {
  assert.equal(isBlocked("pornhub.com"), true);
  assert.equal(isBlocked("cdn.pornhub.com"), true);
  assert.equal(isBlocked("example.com/porn"), true);
  assert.equal(isBlocked("bit.ly/abc"), true);
  assert.equal(isBlocked("linear.app"), false);
  assert.equal(isBlocked("x.com/levelsio"), false);
  // Not a substring match on an unrelated domain that merely contains it.
  assert.equal(isBlocked("notpornbutsafe.com"), true);
});

test("cost to pass rounds up to a whole dollar and respects the ceiling", () => {
  assert.equal(costToPass(0), 100);
  assert.equal(costToPass(100), 200);
  assert.equal(costToPass(4700), 4800);
  assert.equal(costToPass(4701), 4800);
  // Clamped to the per transaction maximum.
  assert.equal(costToPass(100_000), 100_000);
});
