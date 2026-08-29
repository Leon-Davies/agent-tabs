const COMPLETION_SOUND_MESSAGE = "agent-tabs:play-completion-note";
const NOTE_DURATION_SECONDS = 0.2;
const PEAK_GAIN = 0.045;

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio is not available in the Agent Tabs offscreen document.");
    }
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

async function playLightNote(frequency) {
  if (!Number.isFinite(frequency) || frequency < 100 || frequency > 2000) {
    throw new RangeError("Unsupported completion-note frequency.");
  }

  const context = getAudioContext();
  if (context.state === "suspended") {
    await context.resume();
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + NOTE_DURATION_SECONDS);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });

  oscillator.start(now);
  oscillator.stop(now + NOTE_DURATION_SECONDS + 0.01);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== COMPLETION_SOUND_MESSAGE) {
    return false;
  }

  playLightNote(Number(message.frequency))
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.error("Agent Tabs failed to play a completion note.", error);
      sendResponse({ ok: false });
    });

  return true;
});
