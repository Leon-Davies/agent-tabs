import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPLETION_SOUND_MESSAGE,
  OFFSCREEN_DOCUMENT_PATH,
  playCompletionSound,
  shouldPlayCompletionSound
} from "../src/background/completion-sound.js";
import { COLOUR_ORDER } from "../src/background/palette.js";
import {
  SOUND_DEFAULTS,
  frequencyForColour,
  soundScale
} from "../src/background/sound-settings.js";

test("all 15 colours map to unique ascending pitches", () => {
  const scale = soundScale(SOUND_DEFAULTS);
  assert.equal(scale.length, 15);
  assert.deepEqual(scale.map((entry) => entry.colour), COLOUR_ORDER);

  const frequencies = scale.map((entry) => entry.frequency);
  assert.equal(new Set(frequencies).size, frequencies.length);
  for (let index = 1; index < frequencies.length; index += 1) {
    assert.ok(frequencies[index] > frequencies[index - 1]);
  }
});

test("frequency lookup rejects unknown colours", () => {
  assert.ok(Number.isFinite(frequencyForColour("purple", SOUND_DEFAULTS)));
  assert.equal(frequencyForColour("chartreuse", SOUND_DEFAULTS), null);
  assert.equal(frequencyForColour(null, SOUND_DEFAULTS), null);
});

test("completion sound triggers for foreground and background completions", () => {
  assert.equal(shouldPlayCompletionSound("working", "ready", false, "blue"), true);
  assert.equal(shouldPlayCompletionSound("working", "idle", true, "blue"), true);
  assert.equal(shouldPlayCompletionSound("ready", "ready", false, "blue"), false);
  assert.equal(shouldPlayCompletionSound("working", "error", false, "blue"), false);
  assert.equal(shouldPlayCompletionSound("working", "ready", false, null), false);
  assert.equal(shouldPlayCompletionSound("working", "idle", true, "unknown"), false);
});

test("playCompletionSound creates an offscreen audio document with configured pitch and volume", async () => {
  const calls = [];
  const apis = {
    runtime: {
      getURL(path) {
        calls.push(["getURL", path]);
        return `chrome-extension://test/${path}`;
      },
      async getContexts(options) {
        calls.push(["getContexts", options]);
        return [];
      },
      async sendMessage(message) {
        calls.push(["sendMessage", message]);
        return { ok: true };
      }
    },
    offscreen: {
      async createDocument(options) {
        calls.push(["createDocument", options]);
      }
    }
  };
  const settings = { volume: 0.7, pitchStepSemitones: 1.5 };

  assert.equal(await playCompletionSound("green", apis, settings), true);
  assert.deepEqual(calls[0], ["getURL", OFFSCREEN_DOCUMENT_PATH]);
  assert.deepEqual(calls[2], ["createDocument", {
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play a short completion tone when a coloured ChatGPT response finishes."
  }]);
  assert.deepEqual(calls[3], ["sendMessage", {
    type: COMPLETION_SOUND_MESSAGE,
    colour: "green",
    frequency: frequencyForColour("green", settings),
    volume: 0.7
  }]);
});

test("playCompletionSound reuses an existing offscreen document", async () => {
  let created = false;
  let sent = null;
  const apis = {
    runtime: {
      getURL(path) { return `chrome-extension://test/${path}`; },
      async getContexts() { return [{ contextType: "OFFSCREEN_DOCUMENT" }]; },
      async sendMessage(message) {
        sent = message;
        return { ok: true };
      }
    },
    offscreen: {
      async createDocument() { created = true; }
    }
  };

  assert.equal(await playCompletionSound("pink", apis, SOUND_DEFAULTS), true);
  assert.equal(created, false);
  assert.equal(sent.frequency, frequencyForColour("pink", SOUND_DEFAULTS));
});

test("unknown and muted colours do not create audio infrastructure", async () => {
  let touched = false;
  const apis = {
    runtime: {
      getURL() { touched = true; },
      async getContexts() { touched = true; },
      async sendMessage() { touched = true; }
    },
    offscreen: {
      async createDocument() { touched = true; }
    }
  };

  assert.equal(await playCompletionSound("unknown", apis, SOUND_DEFAULTS), false);
  assert.equal(await playCompletionSound("blue", apis, { volume: 0, pitchStepSemitones: 1.25 }), false);
  assert.equal(touched, false);
});
