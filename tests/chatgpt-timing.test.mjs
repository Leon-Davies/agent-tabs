import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  buildTitle,
  conversationStorageKey,
  formatDuration,
  formatRelativeAge,
  stripTitleSuffix
} = require("../src/content/chatgpt-timing.js");

test("relative age uses compact seconds, minutes, hours and days", () => {
  const now = 1_000_000_000;
  assert.equal(formatRelativeAge(now - 5_000, now), "just now");
  assert.equal(formatRelativeAge(now - 37_000, now), "37s ago");
  assert.equal(formatRelativeAge(now - 8 * 60_000, now), "8m ago");
  assert.equal(formatRelativeAge(now - 2 * 60 * 60_000, now), "2h ago");
  assert.equal(formatRelativeAge(now - 2 * 24 * 60 * 60_000, now), "2d ago");
});

test("working duration keeps useful sub-minute detail", () => {
  const now = 1_000_000_000;
  assert.equal(formatDuration(now - 12_000, now), "12s");
  assert.equal(formatDuration(now - 92_000, now), "1m 32s");
  assert.equal(formatDuration(now - 2 * 60 * 60_000 - 5 * 60_000, now), "2h 5m");
});

test("title suffix is replaced instead of duplicated", () => {
  const now = 1_000_000_000;
  const working = buildTitle(
    "Agent task · Last response: 12:00:00 · 4m ago",
    { phase: "working", workingStartedAt: now - 65_000 },
    now,
    "en-GB"
  );

  assert.equal(working, "Agent task · Working for 1m 5s");
  assert.equal(stripTitleSuffix(working), "Agent task");
});

test("idle title includes absolute response time and relative age", () => {
  const responseAt = Date.UTC(2026, 7, 24, 16, 39, 26);
  const now = responseAt + 4 * 60_000;
  const title = buildTitle(
    "Implementation Agent",
    { phase: "idle", lastResponseAt: responseAt },
    now,
    "en-GB"
  );

  assert.match(title, /^Implementation Agent · Last response: .+ · 4m ago$/);
});

test("conversation storage key ignores query strings and hashes", () => {
  assert.equal(
    conversationStorageKey({ origin: "https://chatgpt.com", pathname: "/c/abc" }),
    "agent-tabs-timing:https://chatgpt.com/c/abc"
  );
});
