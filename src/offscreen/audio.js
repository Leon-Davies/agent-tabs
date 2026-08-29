const COMPLETION_SOUND_MESSAGE = "agent-tabs:play-completion-note";
const NOTE_DURATION_SECONDS = 0.24;
const SAMPLE_RATE = 44100;
const PEAK_AMPLITUDE = 0.28;

const activeAudio = new Set();

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function createToneWav(frequency) {
  if (!Number.isFinite(frequency) || frequency < 100 || frequency > 2000) {
    throw new RangeError("Unsupported completion-note frequency.");
  }

  const sampleCount = Math.floor(SAMPLE_RATE * NOTE_DURATION_SECONDS);
  const bytesPerSample = 2;
  const dataLength = sampleCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  const attackSamples = Math.max(1, Math.floor(SAMPLE_RATE * 0.012));
  const releaseStart = Math.floor(sampleCount * 0.3);

  for (let index = 0; index < sampleCount; index += 1) {
    let envelope;
    if (index < attackSamples) {
      envelope = index / attackSamples;
    } else if (index >= releaseStart) {
      const remaining = sampleCount - index;
      envelope = Math.max(0, remaining / (sampleCount - releaseStart));
      envelope *= envelope;
    } else {
      envelope = 1;
    }

    const time = index / SAMPLE_RATE;
    const fundamental = Math.sin(2 * Math.PI * frequency * time);
    const overtone = 0.14 * Math.sin(2 * Math.PI * frequency * 2 * time);
    const sample = Math.max(-1, Math.min(1, (fundamental + overtone) * envelope * PEAK_AMPLITUDE));
    view.setInt16(44 + index * 2, Math.round(sample * 32767), true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function playLightNote(frequency) {
  const blob = createToneWav(frequency);
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  audio.preload = "auto";
  activeAudio.add(audio);

  const cleanup = () => {
    activeAudio.delete(audio);
    URL.revokeObjectURL(objectUrl);
  };

  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("error", cleanup, { once: true });

  try {
    await audio.play();
  } catch (error) {
    cleanup();
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== COMPLETION_SOUND_MESSAGE) {
    return false;
  }

  playLightNote(Number(message.frequency))
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.error("Agent Tabs failed to play a completion note.", error);
      sendResponse({ ok: false, error: String(error?.message || error) });
    });

  return true;
});
