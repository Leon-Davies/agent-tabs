# Architecture

## V0.1 scope

V0.1 proves the manual tab-colour interaction without reading or modifying webpage content.

Chrome does not expose arbitrary per-tab background colours to extensions. Agent Tabs therefore represents an individually coloured tab as a native Chrome tab group containing that one tab.

## User interaction

1. Right-click a tab in Chrome's tab strip.
2. Choose **Agent Tabs > Colour > <colour>**.
3. Agent Tabs creates a one-tab native group, or recolours an existing one-tab group.
4. Choosing **Agent Tabs > Remove colour** ungroups the tab.

If the selected tab already belongs to a group containing multiple tabs, Agent Tabs detaches only that tab before creating its individual colour group. This prevents a request to colour one tab from silently recolouring the user's entire existing group.

## Browser APIs

V0.1 uses:

- `chrome.contextMenus` with the Chrome 150+ `tab` context.
- `chrome.tabs.group()`, `chrome.tabs.ungroup()`, and `chrome.tabs.query()`.
- `chrome.tabGroups.update()` for the native group colour.

The extension deliberately does not request the `tabs` permission because the operations used here do not need access to sensitive tab fields such as page URLs or titles.

## Permissions

Required permissions:

- `contextMenus`
- `tabGroups`

Host permissions: none.

V0.1 therefore cannot inspect page content, prompts, responses, or browsing history through host access.

## Known constraint

A Chrome tab can belong to only one native tab group. Individual colouring therefore consumes the tab's group membership. A tab cannot simultaneously keep an unrelated native group membership and have a separate Agent Tabs colour.

## Next milestone

V0.2 will investigate optional agent-state detection. That work should remain separate because it requires site-specific DOM observation and a different permission/security boundary.
