import { COLOUR_ORDER, isSupportedColour } from "./palette.js";

export const SOUND_SETTINGS_KEY = "agent-tabs-sound-settings";
export const BASE_FREQUENCY_HZ = 220;
export const SOUND_DEFAULTS = Object.freeze({
  volume: 0.55,
  pitchStepSemitones: 1.25
});

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const MIN_PITCH_STEP = 0.5;
const MAX_PITCH_STEP = 2.5;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeSoundSettings(settings = {}) {
  const rawVolume = Number(settings.volume);
  const rawPitchStep = Number(settings.pitchStepSemitones);

  const volume = Number.isFinite(rawVolume)
    ? clamp(rawVolume, MIN_VOLUME, MAX_VOLUME)
    : SOUND_DEFAULTS.volume;
  const pitchStepSemitones = Number.isFinite(rawPitchStep)
    ? clamp(rawPitchStep, MIN_PITCH_STEP, MAX_PITCH_STEP)
    : SOUND_DEFAULTS.pitchStepSemitones;

  return { volume, pitchStepSemitones };
}

export async function getSoundSettings(storage = chrome.storage.local) {
  const stored = await storage.get(SOUND_SETTINGS_KEY);
  return normalizeSoundSettings(stored[SOUND_SETTINGS_KEY]);
}

export async function saveSoundSettings(settings, storage = chrome.storage.local) {
  const normalized = normalizeSoundSettings(settings);
  await storage.set({ [SOUND_SETTINGS_KEY]: normalized });
  return normalized;
}

export async function resetSoundSettings(storage = chrome.storage.local) {
  await storage.remove(SOUND_SETTINGS_KEY);
  return { ...SOUND_DEFAULTS };
}

export function frequencyForColour(colour, settings = SOUND_DEFAULTS) {
  if (!isSupportedColour(colour)) {
    return null;
  }

  const index = COLOUR_ORDER.indexOf(colour);
  if (index < 0) {
    return null;
  }

  const normalized = normalizeSoundSettings(settings);
  const semitonesAboveBase = index * normalized.pitchStepSemitones;
  return BASE_FREQUENCY_HZ * (2 ** (semitonesAboveBase / 12));
}

export function soundScale(settings = SOUND_DEFAULTS) {
  const normalized = normalizeSoundSettings(settings);
  return COLOUR_ORDER.map((colour) => ({
    colour,
    frequency: frequencyForColour(colour, normalized)
  }));
}
