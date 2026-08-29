import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOUR_NOTE_FREQUENCIES,
  COMPLETION_SOUND_MESSAGE,
  OFFSCREEN_DOCUMENT_PATH,
  frequencyForColour,
  playCompletionSound,
  shouldPlayCompletionSound
} from "../src/background/completion-sound.js";

test("every supported colour maps to a unique audible pitch", () => {
  const frequencies = Object.values(COLOUR_NOTE_FREQUENCIES);
  assert.equal(frequencies.length, 9);
  assert.equal(new Set(frequencies).size, frequencies.length);
  assert.ok(frequencies.every((frequency) => frequency >= 100 && frequency <= 2000));
});

test("frequency lookup rejects unknown colours", () => {
  assert.equal(frequencyForColour("purple"), COLOUR_NOTE_FREQUENCIES.purple);
  assert.equal(frequencyForColour("chartreuse"), null);
  assert.equal(frequencyForColour(null), null);
});

test("completion sound only triggers for hidden coloured working-to-ready transition", () => {
  assert.equal(shouldPlayCompletionSound("working", "ready", false, "blue"), true);
  assert.equal(shouldPlayCompletionSound("working", "idle", true, "blue"), false);
  assert.equal(shouldPlayCompletionSound("ready", "ready", false, "blue"), false);
  assert.equal(shouldPlayCompletionSound("working", "ready", false, null), false);
  assert.equal(shouldPlayCompletionSound("working", "ready", false, "unknown"), false);
});

test("playCompletionSound creates an offscreen audio document and sends the pitch", async () => {
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

  assert.equal(await playCompletionSound("green", apis), true);
  assert.deepEqual(calls[0], ["getURL", OFFSCREEN_DOCUMENT_PATH]);
  assert.deepEqual(calls[2], ["createDocument", {
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play a short completion tone when a coloured ChatGPT response finishes."
  }]);
  assert.deepEqual(calls[3], ["sendMessage", {
    type: COMPLETION_SOUND_MESSAGE,
    colour: "green",
    frequency: COLOUR_NOTE_FREQUENCIES.green
  }]);
});

test("playCompletionSound reuses an existing offscreen document", async () => {
  let created = false;
  let sent = null;
  const apis = {
    runtime: {
      getURL(path) { return `chrome-extension://test/${path}`; },
      async getContexts() { return [{ contextType: "OFFSCREEN_DOCUMENT" }]; },
      async sendMessage(message) { sent = message; }
    },
    offscreen: {
      async createDocument() { created = true; }
    }
  };

  assert.equal(await playCompletionSound("pink", apis), true);
  assert.equal(created, false);
  assert.equal(sent.frequency, COLOUR_NOTE_FREQUENCIES.pink);
});

test("unknown colours do not create audio infrastructure", async () => {
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

  assert.equal(await playCompletionSound("unknown", apis), false);
  assert.equal(touched, false);
});
