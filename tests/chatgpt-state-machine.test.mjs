import assert from "node:assert/strict";
import test from "node:test";

import { TAB_STATES, deriveTabState } from "../src/background/chatgpt-state-machine.js";

test("working phase always yields working", () => {
  assert.equal(deriveTabState(TAB_STATES.idle, "working", true), TAB_STATES.working);
  assert.equal(deriveTabState(TAB_STATES.ready, "working", false), TAB_STATES.working);
});

test("hidden completion after working becomes ready", () => {
  assert.equal(deriveTabState(TAB_STATES.working, "idle", false), TAB_STATES.ready);
});

test("visible completion after working becomes idle", () => {
  assert.equal(deriveTabState(TAB_STATES.working, "idle", true), TAB_STATES.idle);
});

test("ready returns to idle when tab becomes visible", () => {
  assert.equal(deriveTabState(TAB_STATES.ready, "idle", true), TAB_STATES.idle);
});

test("ready stays ready while tab remains hidden", () => {
  assert.equal(deriveTabState(TAB_STATES.ready, "idle", false), TAB_STATES.ready);
});

test("error phase yields error", () => {
  assert.equal(deriveTabState(TAB_STATES.idle, "error", true), TAB_STATES.error);
});
