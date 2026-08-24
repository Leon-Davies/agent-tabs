import {
  MENU_IDS,
  applyColourToTab,
  colourFromMenuId,
  forgetTab,
  getStoredTabState,
  installContextMenus,
  removeColourFromTab,
  reapplyStoredMarker,
  setTabState,
  storageKey
} from "./tab-marker.js";
import { deriveTabState } from "./chatgpt-state-machine.js";
import {
  forgetPersistentTab,
  getPersistentColour,
  persistColour,
  removePersistentColour
} from "./colour-persistence.js";

const CHATGPT_SIGNAL = "agent-tabs:chatgpt-signal";

chrome.runtime.onInstalled.addListener(() => {
  installContextMenus().catch((error) => {
    console.error("Agent Tabs failed to install its tab context menu.", error);
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !Number.isInteger(tab.id)) {
    return;
  }

  const colour = colourFromMenuId(info.menuItemId);
  const tabUrl = tab.url || tab.pendingUrl || null;

  if (colour) {
    applyColourAndPersist(tab.id, colour, tabUrl).catch((error) => {
      console.error(`Agent Tabs failed to apply ${colour}.`, error);
    });
    return;
  }

  if (String(info.menuItemId) === MENU_IDS.removeColour) {
    removeColourAndPersistence(tab.id, tabUrl).catch((error) => {
      console.error("Agent Tabs failed to remove the tab colour.", error);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== CHATGPT_SIGNAL || !Number.isInteger(sender.tab?.id)) {
    return false;
  }

  const tabUrl = sender.tab.url || sender.tab.pendingUrl || null;
  handleChatGptSignal(sender.tab.id, message.phase, Boolean(message.visible), tabUrl)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.error("Agent Tabs failed to process a ChatGPT state signal.", error);
      sendResponse({ ok: false });
    });

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  restorePersistentColour(tabId)
    .then(() => reapplyStoredMarker(tabId))
    .catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  Promise.all([
    forgetTab(tabId),
    forgetPersistentTab(tabId)
  ]).catch(() => {});
});

async function applyColourAndPersist(tabId, colour, url) {
  await applyColourToTab(tabId, colour);
  await persistColour(tabId, colour, url);
}

async function removeColourAndPersistence(tabId, url) {
  await removeColourFromTab(tabId);
  await removePersistentColour(tabId, url);
}

async function getTabUrl(tabId, suppliedUrl = null) {
  if (suppliedUrl) {
    return suppliedUrl;
  }

  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.url || tab.pendingUrl || null;
  } catch {
    return null;
  }
}

async function restorePersistentColour(tabId, suppliedUrl = null) {
  const colourKey = storageKey(tabId);
  const session = await chrome.storage.session.get(colourKey);
  const currentColour = session[colourKey];
  const url = await getTabUrl(tabId, suppliedUrl);

  if (currentColour) {
    // Keep the stable ChatGPT conversation mapping in sync when a live tab
    // navigates from a new-chat URL to its final /c/... conversation URL.
    await persistColour(tabId, currentColour, url);
    return currentColour;
  }

  const persistentColour = await getPersistentColour(tabId, url);
  if (!persistentColour) {
    return null;
  }

  await applyColourToTab(tabId, persistentColour);
  return persistentColour;
}

async function handleChatGptSignal(tabId, phase, visible, url = null) {
  await restorePersistentColour(tabId, url);

  const previousState = await getStoredTabState(tabId);
  const nextState = deriveTabState(previousState, phase, visible);

  // Always render the current state. This makes automatic ChatGPT status
  // lights independent from whether the user has assigned a manual colour.
  await setTabState(tabId, nextState);
}
