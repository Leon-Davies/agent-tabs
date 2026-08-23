import {
  MENU_IDS,
  applyColourToTab,
  colourFromMenuId,
  installContextMenus,
  removeColourFromTab
} from "./tab-colour.js";

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
    applyColourToTab(tab, colour).catch((error) => {
      console.error(`Agent Tabs failed to apply ${colour}.`, error);
    });
    return;
  }

  if (String(info.menuItemId) === MENU_IDS.removeColour) {
    removeColourFromTab(tab).catch((error) => {
      console.error("Agent Tabs failed to remove the tab colour.", error);
    });
  }
});
