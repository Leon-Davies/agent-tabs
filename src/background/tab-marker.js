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
const STATE_PREFIX = "agent-tabs-state:";

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function storageKey(tabId) {
  return `${STORAGE_PREFIX}${tabId}`;
}

export function stateStorageKey(tabId) {
  return `${STATE_PREFIX}${tabId}`;
}

export async function installContextMenus(contextMenus = chrome.contextMenus) {
  await contextMenus.removeAll();

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

export function renderColourFavicon(hexColour, state = "idle") {
  const markerId = "agent-tabs-colour-favicon";
  const originalRelAttribute = "data-agent-tabs-original-rel";
  const observerKey = "__agentTabsFaviconObserver";
  const stateKey = "__agentTabsMarkerState";
  const head = document.head || document.documentElement;

  const isFaviconLink = (node) => {
    if (!node || node.nodeType !== Node.ELEMENT_NODE || node.tagName !== "LINK") {
      return false;
    }

    const rel = (node.getAttribute("rel") || "").toLowerCase();
    return rel.split(/\s+/).includes("icon");
  };

  const suppressSiteFavicon = (link) => {
    if (link.id === markerId || !isFaviconLink(link)) {
      return false;
    }

    if (!link.hasAttribute(originalRelAttribute)) {
      link.setAttribute(originalRelAttribute, link.getAttribute("rel") || "icon");
    }

    link.setAttribute("rel", "agent-tabs-original-icon");
    return true;
  };

  let suppressedIcons = 0;
  for (const link of head.querySelectorAll("link[rel]")) {
    if (suppressSiteFavicon(link)) {
      suppressedIcons += 1;
    }
  }

  const drawMarker = (colour, markerState) => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create Agent Tabs favicon canvas.");
    }

    context.clearRect(0, 0, 32, 32);
    context.fillStyle = colour;
    context.beginPath();

    if (typeof context.roundRect === "function") {
      context.roundRect(1, 1, 30, 30, 7);
      context.fill();
    } else {
      context.fillRect(1, 1, 30, 30);
    }

    const badgeColours = {
      working: "#F9AB00",
      ready: "#34A853",
      error: "#EA4335"
    };
    const badgeColour = badgeColours[markerState] || null;

    if (badgeColour) {
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(24, 24, 7, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = badgeColour;
      context.beginPath();
      context.arc(24, 24, 5, 0, Math.PI * 2);
      context.fill();
    }

    return canvas.toDataURL("image/png");
  };

  globalThis[stateKey] = {
    colour: hexColour,
    state
  };

  let marker = document.getElementById(markerId);
  if (!marker) {
    marker = document.createElement("link");
    marker.id = markerId;
  }

  marker.rel = "icon";
  marker.type = "image/png";
  marker.sizes = "32x32";
  marker.href = drawMarker(hexColour, state);
  head.appendChild(marker);

  if (!globalThis[observerKey]) {
    const observer = new MutationObserver((mutations) => {
      const activeMarker = document.getElementById(markerId);
      if (!activeMarker) {
        return;
      }

      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          suppressSiteFavicon(mutation.target);
          continue;
        }

        for (const addedNode of mutation.addedNodes) {
          if (isFaviconLink(addedNode)) {
            suppressSiteFavicon(addedNode);
          }

          if (addedNode.querySelectorAll) {
            for (const link of addedNode.querySelectorAll("link[rel]")) {
              suppressSiteFavicon(link);
            }
          }
        }
      }

      if (activeMarker.parentNode === head && activeMarker !== head.lastElementChild) {
        head.appendChild(activeMarker);
      }
    });

    observer.observe(head, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["rel"]
    });

    globalThis[observerKey] = observer;
  }

  return {
    markerInstalled: Boolean(document.getElementById(markerId)),
    suppressedIcons,
    state
  };
}

export function removeColourFavicon() {
  const markerId = "agent-tabs-colour-favicon";
  const originalRelAttribute = "data-agent-tabs-original-rel";
  const observerKey = "__agentTabsFaviconObserver";
  const stateKey = "__agentTabsMarkerState";

  if (globalThis[observerKey]) {
    globalThis[observerKey].disconnect();
    delete globalThis[observerKey];
  }

  delete globalThis[stateKey];
  document.getElementById(markerId)?.remove();

  let restoredIcons = 0;
  for (const link of document.querySelectorAll(`link[${originalRelAttribute}]`)) {
    const originalRel = link.getAttribute(originalRelAttribute);
    link.removeAttribute(originalRelAttribute);
    link.setAttribute("rel", originalRel || "icon");
    restoredIcons += 1;
  }

  return { restoredIcons };
}

export async function getStoredTabState(tabId, storage = chrome.storage.session) {
  const key = stateStorageKey(tabId);
  const stored = await storage.get(key);
  const state = stored[key];
  return ["idle", "working", "ready", "error"].includes(state) ? state : "idle";
}

export async function applyColourToTab(tabId, colour, apis = chrome) {
  if (!Number.isInteger(tabId)) {
    throw new TypeError("A numeric tab id is required.");
  }

  if (!Object.hasOwn(COLOURS, colour)) {
    throw new RangeError(`Unsupported colour: ${colour}`);
  }

  const state = await getStoredTabState(tabId, apis.storage.session);
  const results = await apis.scripting.executeScript({
    target: { tabId },
    func: renderColourFavicon,
    args: [COLOURS[colour], state]
  });

  const result = results?.[0]?.result;
  if (result && result.markerInstalled === false) {
    throw new Error("Agent Tabs marker was not installed in the selected tab.");
  }

  await apis.storage.session.set({ [storageKey(tabId)]: colour });
  return result || null;
}

export async function setTabState(tabId, state, apis = chrome) {
  if (!Number.isInteger(tabId)) {
    throw new TypeError("A numeric tab id is required.");
  }

  if (!["idle", "working", "ready", "error"].includes(state)) {
    throw new RangeError(`Unsupported tab state: ${state}`);
  }

  await apis.storage.session.set({ [stateStorageKey(tabId)]: state });

  const colourKey = storageKey(tabId);
  const stored = await apis.storage.session.get(colourKey);
  const colour = stored[colourKey];

  if (!Object.hasOwn(COLOURS, colour)) {
    return false;
  }

  await apis.scripting.executeScript({
    target: { tabId },
    func: renderColourFavicon,
    args: [COLOURS[colour], state]
  });

  return true;
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

  const colourKey = storageKey(tabId);
  const stored = await apis.storage.session.get(colourKey);
  const colour = stored[colourKey];

  if (!Object.hasOwn(COLOURS, colour)) {
    return false;
  }

  const state = await getStoredTabState(tabId, apis.storage.session);
  await apis.scripting.executeScript({
    target: { tabId },
    func: renderColourFavicon,
    args: [COLOURS[colour], state]
  });

  return true;
}

export async function forgetTab(tabId, storage = chrome.storage.session) {
  if (Number.isInteger(tabId)) {
    await storage.remove([storageKey(tabId), stateStorageKey(tabId)]);
  }
}
