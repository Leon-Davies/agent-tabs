export const COLOURS = Object.freeze({
  grey: "#9AA0A6",
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#F9AB00",
  green: "#34A853",
  pink: "#D01884",
  purple: "#A142F4",
  cyan: "#24C1E0",
  orange: "#FA7B17"
});

export const MENU_IDS = Object.freeze({
  colourRoot: "agent-tabs-colour-root",
  colourPrefix: "agent-tabs-colour-",
  removeColour: "agent-tabs-remove-colour"
});

const STORAGE_PREFIX = "agent-tabs-colour:";

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function storageKey(tabId) {
  return `${STORAGE_PREFIX}${tabId}`;
}

export async function installContextMenus(contextMenus = chrome.contextMenus) {
  await contextMenus.removeAll();

  // Keep exactly one top-level extension item. Chrome automatically collapses
  // multiple visible items from one extension into an extension-owned parent.
  await contextMenus.create({
    id: MENU_IDS.colourRoot,
    title: "Colour",
    contexts: ["tab"]
  });

  for (const colour of Object.keys(COLOURS)) {
    await contextMenus.create({
      id: `${MENU_IDS.colourPrefix}${colour}`,
      parentId: MENU_IDS.colourRoot,
      title: titleCase(colour),
      contexts: ["tab"]
    });
  }

  await contextMenus.create({
    id: "agent-tabs-colour-separator",
    parentId: MENU_IDS.colourRoot,
    type: "separator",
    contexts: ["tab"]
  });

  await contextMenus.create({
    id: MENU_IDS.removeColour,
    parentId: MENU_IDS.colourRoot,
    title: "Remove colour",
    contexts: ["tab"]
  });
}

export function colourFromMenuId(menuItemId) {
  const id = String(menuItemId);
  if (!id.startsWith(MENU_IDS.colourPrefix)) {
    return null;
  }

  const colour = id.slice(MENU_IDS.colourPrefix.length);
  return Object.hasOwn(COLOURS, colour) ? colour : null;
}

export function renderColourFavicon(hexColour) {
  const markerId = "agent-tabs-colour-favicon";
  const existing = document.getElementById(markerId);
  const link = existing || document.createElement("link");
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
    `<rect x="2" y="2" width="28" height="28" rx="8" fill="${hexColour}"/>`,
    "</svg>"
  ].join("");

  link.id = markerId;
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  // Appending an existing node moves it to the end of <head>, which keeps the
  // visual override later than the site's ordinary favicon declarations.
  (document.head || document.documentElement).appendChild(link);
}

export function removeColourFavicon() {
  document.getElementById("agent-tabs-colour-favicon")?.remove();
}

export async function applyColourToTab(tabId, colour, apis = chrome) {
  if (!Number.isInteger(tabId)) {
    throw new TypeError("A numeric tab id is required.");
  }

  if (!Object.hasOwn(COLOURS, colour)) {
    throw new RangeError(`Unsupported colour: ${colour}`);
  }

  await apis.scripting.executeScript({
    target: { tabId },
    func: renderColourFavicon,
    args: [COLOURS[colour]]
  });

  await apis.storage.session.set({ [storageKey(tabId)]: colour });
}

export async function removeColourFromTab(tabId, apis = chrome) {
  if (!Number.isInteger(tabId)) {
    throw new TypeError("A numeric tab id is required.");
  }

  await apis.scripting.executeScript({
    target: { tabId },
    func: removeColourFavicon
  });

  await apis.storage.session.remove(storageKey(tabId));
}

export async function reapplyStoredColour(tabId, apis = chrome) {
  if (!Number.isInteger(tabId)) {
    return false;
  }

  const key = storageKey(tabId);
  const stored = await apis.storage.session.get(key);
  const colour = stored[key];

  if (!Object.hasOwn(COLOURS, colour)) {
    return false;
  }

  await apis.scripting.executeScript({
    target: { tabId },
    func: renderColourFavicon,
    args: [COLOURS[colour]]
  });

  return true;
}

export async function forgetTab(tabId, storage = chrome.storage.session) {
  if (Number.isInteger(tabId)) {
    await storage.remove(storageKey(tabId));
  }
}
