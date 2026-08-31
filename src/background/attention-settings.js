export const ATTENTION_SETTINGS_KEY = "agent-tabs-attention-settings";

export const ATTENTION_DEFAULTS = Object.freeze({
  enabled: true,
  intervalMs: 650,
  intensity: 0.8
});

export const ATTENTION_LIMITS = Object.freeze({
  minIntervalMs: 300,
  maxIntervalMs: 1400,
  minIntensity: 0.3,
  maxIntensity: 1
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function numericSetting(value) {
  if (value === null || value === undefined || value === "") {
    return Number.NaN;
  }
  return Number(value);
}

export function normalizeAttentionSettings(settings = {}) {
  const rawInterval = numericSetting(settings.intervalMs);
  const rawIntensity = numericSetting(settings.intensity);

  return {
    enabled: typeof settings.enabled === "boolean"
      ? settings.enabled
      : ATTENTION_DEFAULTS.enabled,
    intervalMs: Number.isFinite(rawInterval)
      ? Math.round(clamp(rawInterval, ATTENTION_LIMITS.minIntervalMs, ATTENTION_LIMITS.maxIntervalMs))
      : ATTENTION_DEFAULTS.intervalMs,
    intensity: Number.isFinite(rawIntensity)
      ? clamp(rawIntensity, ATTENTION_LIMITS.minIntensity, ATTENTION_LIMITS.maxIntensity)
      : ATTENTION_DEFAULTS.intensity
  };
}

export async function getAttentionSettings(storage = chrome.storage.local) {
  const stored = await storage.get(ATTENTION_SETTINGS_KEY);
  return normalizeAttentionSettings(stored[ATTENTION_SETTINGS_KEY]);
}

export async function saveAttentionSettings(settings, storage = chrome.storage.local) {
  const normalized = normalizeAttentionSettings(settings);
  await storage.set({ [ATTENTION_SETTINGS_KEY]: normalized });
  return normalized;
}

export async function resetAttentionSettings(storage = chrome.storage.local) {
  await storage.remove(ATTENTION_SETTINGS_KEY);
  return { ...ATTENTION_DEFAULTS };
}
