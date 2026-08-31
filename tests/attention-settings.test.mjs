import assert from "node:assert/strict";
import test from "node:test";

import {
  ATTENTION_DEFAULTS,
  ATTENTION_SETTINGS_KEY,
  getAttentionSettings,
  normalizeAttentionSettings,
  resetAttentionSettings,
  saveAttentionSettings
} from "../src/background/attention-settings.js";

test("ready attention animation is enabled by default", () => {
  assert.equal(ATTENTION_DEFAULTS.enabled, true);
  assert.equal(ATTENTION_DEFAULTS.intervalMs, 650);
  assert.equal(ATTENTION_DEFAULTS.intensity, 0.8);
});

test("attention settings are clamped to safe ranges", () => {
  assert.deepEqual(
    normalizeAttentionSettings({ enabled: false, intervalMs: 20, intensity: 4 }),
    { enabled: false, intervalMs: 300, intensity: 1 }
  );

  assert.deepEqual(
    normalizeAttentionSettings({ enabled: true, intervalMs: 5000, intensity: 0.01 }),
    { enabled: true, intervalMs: 1400, intensity: 0.3 }
  );
});

test("invalid attention values fall back to defaults", () => {
  assert.deepEqual(
    normalizeAttentionSettings({ enabled: "yes", intervalMs: "nope", intensity: null }),
    ATTENTION_DEFAULTS
  );
});

test("attention settings load, save and reset from local storage", async () => {
  const values = {};
  const calls = [];
  const storage = {
    async get(key) {
      return { [key]: values[key] };
    },
    async set(next) {
      Object.assign(values, next);
      calls.push(["set", next]);
    },
    async remove(key) {
      delete values[key];
      calls.push(["remove", key]);
    }
  };

  const saved = await saveAttentionSettings({
    enabled: false,
    intervalMs: 475,
    intensity: 0.65
  }, storage);

  assert.deepEqual(saved, {
    enabled: false,
    intervalMs: 475,
    intensity: 0.65
  });
  assert.deepEqual(await getAttentionSettings(storage), saved);
  assert.deepEqual(calls[0], ["set", { [ATTENTION_SETTINGS_KEY]: saved }]);

  assert.deepEqual(await resetAttentionSettings(storage), ATTENTION_DEFAULTS);
  assert.deepEqual(calls[1], ["remove", ATTENTION_SETTINGS_KEY]);
  assert.deepEqual(await getAttentionSettings(storage), ATTENTION_DEFAULTS);
});
