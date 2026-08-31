import { COLOURS, COLOUR_ORDER, colourLabel } from "../background/palette.js";
import {
  SOUND_DEFAULTS,
  getSoundSettings,
  resetSoundSettings,
  saveSoundSettings,
  soundScale
} from "../background/sound-settings.js";
import {
  ATTENTION_DEFAULTS,
  getAttentionSettings,
  normalizeAttentionSettings,
  resetAttentionSettings,
  saveAttentionSettings
} from "../background/attention-settings.js";

const PREVIEW_SOUND_MESSAGE = "agent-tabs:preview-colour-sound";
const ATTENTION_SETTINGS_CHANGED_MESSAGE = "agent-tabs:attention-settings-changed";

const volumeInput = document.getElementById("volume");
const volumeValue = document.getElementById("volume-value");
const pitchInput = document.getElementById("pitch-spacing");
const pitchValue = document.getElementById("pitch-value");
const previewColour = document.getElementById("preview-colour");
const previewButton = document.getElementById("preview-selected");
const scaleList = document.getElementById("scale-list");
const attentionEnabled = document.getElementById("attention-enabled");
const attentionSpeed = document.getElementById("attention-speed");
const attentionSpeedValue = document.getElementById("attention-speed-value");
const attentionIntensity = document.getElementById("attention-intensity");
const attentionIntensityValue = document.getElementById("attention-intensity-value");
const attentionPreview = document.getElementById("attention-preview");
const attentionPreviewDot = document.getElementById("attention-preview-dot");
const resetButton = document.getElementById("reset");
const status = document.getElementById("status");

let statusTimer = null;
let attentionPreviewTimer = null;

function currentSoundSettings() {
  return {
    volume: Number(volumeInput.value) / 100,
    pitchStepSemitones: Number(pitchInput.value)
  };
}

function currentAttentionSettings() {
  return normalizeAttentionSettings({
    enabled: attentionEnabled.checked,
    intervalMs: Number(attentionSpeed.value),
    intensity: Number(attentionIntensity.value) / 100
  });
}

function showStatus(message) {
  status.textContent = message;
  if (statusTimer) {
    clearTimeout(statusTimer);
  }
  statusTimer = setTimeout(() => {
    status.textContent = "";
  }, 1800);
}

function renderSoundSettings(settings) {
  volumeInput.value = String(Math.round(settings.volume * 100));
  pitchInput.value = String(settings.pitchStepSemitones);
  volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
  pitchValue.textContent = `${settings.pitchStepSemitones.toFixed(2)} semitones`;
  renderScale(settings);
}

function renderScale(settings) {
  volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
  pitchValue.textContent = `${settings.pitchStepSemitones.toFixed(2)} semitones`;
  scaleList.replaceChildren();

  for (const { colour, frequency } of soundScale(settings)) {
    const row = document.createElement("li");
    row.className = "scale-row";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.backgroundColor = COLOURS[colour];
    swatch.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = colourLabel(colour);

    const frequencyLabel = document.createElement("span");
    frequencyLabel.className = "frequency";
    frequencyLabel.textContent = `${Math.round(frequency)} Hz`;

    row.append(swatch, label, frequencyLabel);
    scaleList.append(row);
  }
}

function stopAttentionPreview() {
  if (attentionPreviewTimer) {
    clearInterval(attentionPreviewTimer);
    attentionPreviewTimer = null;
  }
}

function renderAttentionPreview(settings) {
  stopAttentionPreview();

  const normalized = normalizeAttentionSettings(settings);
  attentionSpeedValue.textContent = `${normalized.intervalMs} ms`;
  attentionIntensityValue.textContent = `${Math.round(normalized.intensity * 100)}%`;
  attentionSpeed.disabled = !normalized.enabled;
  attentionIntensity.disabled = !normalized.enabled;

  const outerSize = 22 + Math.round(12 * normalized.intensity);
  const innerSize = 13 + Math.round(9 * normalized.intensity);

  if (!normalized.enabled) {
    attentionPreview.dataset.animated = "false";
    attentionPreviewDot.style.width = "18px";
    attentionPreviewDot.style.height = "18px";
    attentionPreviewDot.style.left = "auto";
    attentionPreviewDot.style.top = "auto";
    attentionPreviewDot.style.right = "5px";
    attentionPreviewDot.style.bottom = "5px";
    attentionPreviewDot.style.background = "#34A853";
    attentionPreviewDot.style.border = "4px solid #ffffff";
    return;
  }

  attentionPreview.dataset.animated = "true";
  attentionPreviewDot.style.width = `${outerSize}px`;
  attentionPreviewDot.style.height = `${outerSize}px`;
  attentionPreviewDot.style.left = "50%";
  attentionPreviewDot.style.top = "50%";
  attentionPreviewDot.style.right = "auto";
  attentionPreviewDot.style.bottom = "auto";

  let phase = false;
  const paintPhase = () => {
    phase = !phase;
    attentionPreviewDot.style.transform = "translate(-50%, -50%)";
    attentionPreviewDot.style.background = phase ? "#34A853" : "#ffffff";
    attentionPreviewDot.style.border = `${Math.max(4, Math.round((outerSize - innerSize) / 2))}px solid ${phase ? "#ffffff" : "#34A853"}`;
  };

  paintPhase();
  attentionPreviewTimer = setInterval(paintPhase, normalized.intervalMs);
}

function renderAttentionSettings(settings) {
  const normalized = normalizeAttentionSettings(settings);
  attentionEnabled.checked = normalized.enabled;
  attentionSpeed.value = String(normalized.intervalMs);
  attentionIntensity.value = String(Math.round(normalized.intensity * 100));
  renderAttentionPreview(normalized);
}

async function persistSoundSettings() {
  const settings = await saveSoundSettings(currentSoundSettings());
  renderScale(settings);
  showStatus("Saved");
}

async function notifyAttentionSettingsChanged() {
  try {
    await chrome.runtime.sendMessage({ type: ATTENTION_SETTINGS_CHANGED_MESSAGE });
  } catch {
    // The saved settings remain valid even if no service worker is available
    // to refresh existing tabs immediately.
  }
}

async function persistAttentionSettings() {
  const settings = await saveAttentionSettings(currentAttentionSettings());
  renderAttentionSettings(settings);
  await notifyAttentionSettingsChanged();
  showStatus("Saved");
}

for (const colour of COLOUR_ORDER) {
  const option = document.createElement("option");
  option.value = colour;
  option.textContent = colourLabel(colour);
  previewColour.append(option);
}
previewColour.value = "purple";

volumeInput.addEventListener("input", () => renderScale(currentSoundSettings()));
pitchInput.addEventListener("input", () => renderScale(currentSoundSettings()));
volumeInput.addEventListener("change", persistSoundSettings);
pitchInput.addEventListener("change", persistSoundSettings);

attentionEnabled.addEventListener("change", persistAttentionSettings);
attentionSpeed.addEventListener("input", () => renderAttentionPreview(currentAttentionSettings()));
attentionIntensity.addEventListener("input", () => renderAttentionPreview(currentAttentionSettings()));
attentionSpeed.addEventListener("change", persistAttentionSettings);
attentionIntensity.addEventListener("change", persistAttentionSettings);

previewButton.addEventListener("click", async () => {
  const settings = await saveSoundSettings(currentSoundSettings());
  const response = await chrome.runtime.sendMessage({
    type: PREVIEW_SOUND_MESSAGE,
    colour: previewColour.value
  });

  if (response?.ok) {
    showStatus("Preview played");
  } else {
    showStatus(response?.error || "Could not play preview");
  }
  renderScale(settings);
});

resetButton.addEventListener("click", async () => {
  const [soundSettings, attentionSettings] = await Promise.all([
    resetSoundSettings(),
    resetAttentionSettings()
  ]);
  renderSoundSettings(soundSettings);
  renderAttentionSettings(attentionSettings);
  await notifyAttentionSettingsChanged();
  showStatus("Defaults restored");
});

Promise.all([
  getSoundSettings().catch(() => SOUND_DEFAULTS),
  getAttentionSettings().catch(() => ATTENTION_DEFAULTS)
]).then(([soundSettings, attentionSettings]) => {
  renderSoundSettings(soundSettings);
  renderAttentionSettings(attentionSettings);
});
