import { COLOURS, COLOUR_ORDER, colourLabel } from "../background/palette.js";
import {
  SOUND_DEFAULTS,
  getSoundSettings,
  resetSoundSettings,
  saveSoundSettings,
  soundScale
} from "../background/sound-settings.js";

const PREVIEW_SOUND_MESSAGE = "agent-tabs:preview-colour-sound";
const volumeInput = document.getElementById("volume");
const volumeValue = document.getElementById("volume-value");
const pitchInput = document.getElementById("pitch-spacing");
const pitchValue = document.getElementById("pitch-value");
const previewColour = document.getElementById("preview-colour");
const previewButton = document.getElementById("preview-selected");
const scaleList = document.getElementById("scale-list");
const resetButton = document.getElementById("reset");
const status = document.getElementById("status");

let statusTimer = null;

function currentSettings() {
  return {
    volume: Number(volumeInput.value) / 100,
    pitchStepSemitones: Number(pitchInput.value)
  };
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

function renderSettings(settings) {
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

async function persistCurrentSettings() {
  const settings = await saveSoundSettings(currentSettings());
  renderScale(settings);
  showStatus("Saved");
}

for (const colour of COLOUR_ORDER) {
  const option = document.createElement("option");
  option.value = colour;
  option.textContent = colourLabel(colour);
  previewColour.append(option);
}
previewColour.value = "purple";

volumeInput.addEventListener("input", () => renderScale(currentSettings()));
pitchInput.addEventListener("input", () => renderScale(currentSettings()));
volumeInput.addEventListener("change", persistCurrentSettings);
pitchInput.addEventListener("change", persistCurrentSettings);

previewButton.addEventListener("click", async () => {
  const settings = await saveSoundSettings(currentSettings());
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
  const settings = await resetSoundSettings();
  renderSettings(settings);
  showStatus("Defaults restored");
});

getSoundSettings()
  .then(renderSettings)
  .catch(() => renderSettings(SOUND_DEFAULTS));
