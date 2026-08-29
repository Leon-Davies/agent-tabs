export const COMPLETION_SOUND_MESSAGE = "agent-tabs:play-completion-note";
export const OFFSCREEN_DOCUMENT_PATH = "src/offscreen/audio.html";

export const COLOUR_NOTE_FREQUENCIES = Object.freeze({
  grey: 261.63,
  blue: 293.66,
  cyan: 329.63,
  green: 349.23,
  yellow: 392.0,
  orange: 440.0,
  red: 493.88,
  pink: 523.25,
  purple: 587.33
});

let creatingOffscreenDocument = null;

export function frequencyForColour(colour) {
  const frequency = COLOUR_NOTE_FREQUENCIES[colour];
  return Number.isFinite(frequency) ? frequency : null;
}

export function shouldPlayCompletionSound(previousState, nextState, visible, colour) {
  return previousState === "working" &&
    nextState === "ready" &&
    visible === false &&
    frequencyForColour(colour) !== null;
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

export async function playCompletionSound(colour, apis = chrome) {
  const frequency = frequencyForColour(colour);
  if (frequency === null) {
    return false;
  }

  await ensureOffscreenDocument(apis);
  await apis.runtime.sendMessage({
    type: COMPLETION_SOUND_MESSAGE,
    colour,
    frequency
  });

  return true;
}
