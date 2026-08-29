export const COLOURS = Object.freeze({
  black: "#202124",
  navy: "#174EA6",
  brown: "#795548",
  pink: "#D01884",
  purple: "#A142F4",
  teal: "#00897B",
  red: "#EA4335",
  blue: "#4285F4",
  green: "#34A853",
  orange: "#FA7B17",
  grey: "#9AA0A6",
  cyan: "#24C1E0",
  lime: "#A8C700",
  yellow: "#F9AB00",
  cream: "#FDE293"
});

// Darkest to lightest by WCAG relative luminance. This same order is used by
// the colour menu and by the completion-note pitch scale.
export const COLOUR_ORDER = Object.freeze([
  "black",
  "navy",
  "brown",
  "pink",
  "purple",
  "teal",
  "red",
  "blue",
  "green",
  "orange",
  "grey",
  "cyan",
  "lime",
  "yellow",
  "cream"
]);

export function colourLabel(colour) {
  return String(colour).charAt(0).toUpperCase() + String(colour).slice(1);
}

export function relativeLuminance(hexColour) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(hexColour));
  if (!match) {
    return null;
  }

  const value = match[1];
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function isSupportedColour(colour) {
  return Object.hasOwn(COLOURS, colour);
}
