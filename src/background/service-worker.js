import {
  MENU_IDS,
  applyColourToTab,
  colourFromMenuId,
  forgetTab,
  installContextMenus,
  reapplyStoredColour,
  removeColourFromTab
} from "./tab-marker.js";

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  // activeTab access survives same-origin navigation/reloads. If Chrome has
  // revoked access (for example after cross-origin navigation), fail quietly;
  // the user can simply assign a colour again on the new page.
  reapplyStoredColour(tabId).catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  forgetTab(tabId).catch(() => {});
});
