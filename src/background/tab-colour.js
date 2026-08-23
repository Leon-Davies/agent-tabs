export const TAB_GROUP_ID_NONE = -1;

export const COLOURS = Object.freeze([
  "grey",
  "blue",
  "red",
  "yellow",
  "green",
  "pink",
  "purple",
  "cyan",
  "orange"
]);

export const MENU_IDS = Object.freeze({
  root: "agent-tabs-root",
  colourRoot: "agent-tabs-colour-root",
  colourPrefix: "agent-tabs-colour-",
  removeColour: "agent-tabs-remove-colour"
});

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function installContextMenus(contextMenus = chrome.contextMenus) {
  await contextMenus.removeAll();

  await contextMenus.create({
    id: MENU_IDS.root,
    title: "Agent Tabs",
    contexts: ["tab"]
  });

  await contextMenus.create({
    id: MENU_IDS.colourRoot,
    parentId: MENU_IDS.root,
    title: "Colour",
    contexts: ["tab"]
  });

  for (const colour of COLOURS) {
    await contextMenus.create({
      id: `${MENU_IDS.colourPrefix}${colour}`,
      parentId: MENU_IDS.colourRoot,
      title: titleCase(colour),
      contexts: ["tab"]
    });
  }

  await contextMenus.create({
    id: MENU_IDS.removeColour,
    parentId: MENU_IDS.root,
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
  return COLOURS.includes(colour) ? colour : null;
}

async function createSingleTabGroup(tabId, tabsApi) {
  return tabsApi.group({ tabIds: tabId });
}

export async function applyColourToTab(tab, colour, apis = chrome) {
  if (!tab || !Number.isInteger(tab.id)) {
    throw new TypeError("A tab with a numeric id is required.");
  }

  if (!COLOURS.includes(colour)) {
    throw new RangeError(`Unsupported tab-group colour: ${colour}`);
  }

  let groupId = tab.groupId;

  if (!Number.isInteger(groupId) || groupId === TAB_GROUP_ID_NONE) {
    groupId = await createSingleTabGroup(tab.id, apis.tabs);
  } else {
    const groupedTabs = await apis.tabs.query({ groupId });

    if (groupedTabs.length > 1) {
      // A Chrome tab can belong to only one group. Detach just this tab so
      // colouring it does not silently recolour the user's entire group.
      await apis.tabs.ungroup(tab.id);
      groupId = await createSingleTabGroup(tab.id, apis.tabs);
    }
  }

  await apis.tabGroups.update(groupId, { color: colour });
  return groupId;
}

export async function removeColourFromTab(tab, tabsApi = chrome.tabs) {
  if (!tab || !Number.isInteger(tab.id)) {
    throw new TypeError("A tab with a numeric id is required.");
  }

  if (tab.groupId === TAB_GROUP_ID_NONE) {
    return false;
  }

  await tabsApi.ungroup(tab.id);
  return true;
}
