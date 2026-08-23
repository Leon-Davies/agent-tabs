import {
  MENU_IDS,
  applyColourToTab,
  colourFromMenuId,
  forgetTab,
  getStoredTabState,
  installContextMenus,
  removeColourFromTab,
  reapplyStoredMarker,
  setTabState
} from "./tab-marker.js";
import { deriveTabState } from "./chatgpt-state-machine.js";

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

  if (colour) {
    applyColourToTab(tab.id, colour).catch((error) => {
      console.error(`Agent Tabs failed to apply ${colour}.`, error);
    });
    return;
  }

  if (String(info.menuItemId) === MENU_IDS.removeColour) {
    removeColourFromTab(tab.id).catch((error) => {
      console.error("Agent Tabs failed to remove the tab colour.", error);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== CHATGPT_SIGNAL || !Number.isInteger(sender.tab?.id)) {
    return false;
  }

  handleChatGptSignal(sender.tab.id, message.phase, Boolean(message.visible))
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

  reapplyStoredMarker(tabId).catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  forgetTab(tabId).catch(() => {});
});

async function handleChatGptSignal(tabId, phase, visible) {
  const previousState = await getStoredTabState(tabId);
  const nextState = deriveTabState(previousState, phase, visible);

  // Always render the current state. This makes automatic ChatGPT status
  // lights independent from whether the user has assigned a manual colour.
  await setTabState(tabId, nextState);
}
