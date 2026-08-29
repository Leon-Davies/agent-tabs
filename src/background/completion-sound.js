import { isSupportedColour } from "./palette.js";
import { frequencyForColour, getSoundSettings } from "./sound-settings.js";

export const COMPLETION_SOUND_MESSAGE = "agent-tabs:play-completion-note";
export const OFFSCREEN_DOCUMENT_PATH = "src/offscreen/audio.html";

let creatingOffscreenDocument = null;

export function shouldPlayCompletionSound(previousState, nextState, _visible, colour) {
  const completed = previousState === "working" &&
    (nextState === "ready" || nextState === "idle");

  return completed && isSupportedColour(colour);
}

export async function ensureOffscreenDocument(apis = chrome) {
  const documentUrl = apis.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const existingContexts = await apis.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [documentUrl]
  });

  if (existingContexts.length > 0) {
    return false;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = apis.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play a short completion tone when a coloured ChatGPT response finishes."
    }).finally(() => {
      creatingOffscreenDocument = null;
    });
  }

  await creatingOffscreenDocument;
  return true;
}

export async function playCompletionSound(colour, apis = chrome, settingsOverride = null) {
  if (!isSupportedColour(colour)) {
    return false;
  }

  const settings = settingsOverride || await getSoundSettings(apis.storage.local);
  if (settings.volume <= 0) {
    return false;
  }

  const frequency = frequencyForColour(colour, settings);
  if (!Number.isFinite(frequency)) {
    return false;
  }

  await ensureOffscreenDocument(apis);
  const response = await apis.runtime.sendMessage({
    type: COMPLETION_SOUND_MESSAGE,
    colour,
    frequency,
    volume: settings.volume
  });

  if (response?.ok === false) {
    throw new Error(response.error || "The offscreen audio document could not play the note.");
  }

  return true;
}
