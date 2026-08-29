import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOURS,
  COLOUR_ORDER,
  relativeLuminance
} from "../src/background/palette.js";
import {
  BASE_FREQUENCY_HZ,
  SOUND_DEFAULTS,
  SOUND_SETTINGS_KEY,
  frequencyForColour,
  getSoundSettings,
  normalizeSoundSettings,
  saveSoundSettings,
  soundScale
} from "../src/background/sound-settings.js";

test("palette contains 15 colours ordered from darkest to lightest", () => {
  assert.equal(Object.keys(COLOURS).length, 15);
  assert.equal(COLOUR_ORDER.length, 15);
  assert.equal(new Set(COLOUR_ORDER).size, 15);

  const luminances = COLOUR_ORDER.map((colour) => relativeLuminance(COLOURS[colour]));
  for (let index = 1; index < luminances.length; index += 1) {
    assert.ok(luminances[index] >= luminances[index - 1], `${COLOUR_ORDER[index]} should not be darker than ${COLOUR_ORDER[index - 1]}`);
  }
});

test("default sound scale begins at base pitch and rises with colour brightness", () => {
  const scale = soundScale(SOUND_DEFAULTS);
  assert.equal(scale[0].colour, "black");
  assert.equal(scale[0].frequency, BASE_FREQUENCY_HZ);
  assert.equal(scale.at(-1).colour, "cream");
  assert.ok(scale.at(-1).frequency > scale[0].frequency);
});

test("pitch spacing changes the gap without changing the darkest base note", () => {
  const narrow = { volume: 0.55, pitchStepSemitones: 0.5 };
  const wide = { volume: 0.55, pitchStepSemitones: 2.5 };

  assert.equal(frequencyForColour("black", narrow), BASE_FREQUENCY_HZ);
  assert.equal(frequencyForColour("black", wide), BASE_FREQUENCY_HZ);
  assert.ok(frequencyForColour("cream", wide) > frequencyForColour("cream", narrow));
});

test("sound settings are clamped to safe ranges", () => {
  assert.deepEqual(normalizeSoundSettings({ volume: 7, pitchStepSemitones: 99 }), {
    volume: 1,
    pitchStepSemitones: 2.5
  });
  assert.deepEqual(normalizeSoundSettings({ volume: -1, pitchStepSemitones: 0 }), {
    volume: 0,
    pitchStepSemitones: 0.5
  });
  assert.deepEqual(normalizeSoundSettings({}), SOUND_DEFAULTS);
});

test("sound settings load and save as one local object", async () => {
  let value = {};
  const storage = {
    async get(key) {
      assert.equal(key, SOUND_SETTINGS_KEY);
      return value;
    },
    async set(next) {
      value = next;
    }
  };

  assert.deepEqual(await getSoundSettings(storage), SOUND_DEFAULTS);
  const saved = await saveSoundSettings({ volume: 0.65, pitchStepSemitones: 1.75 }, storage);
  assert.deepEqual(saved, { volume: 0.65, pitchStepSemitones: 1.75 });
  assert.deepEqual(await getSoundSettings(storage), saved);
});
