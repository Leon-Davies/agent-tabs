# Architecture

## V0.1 scope

V0.1 provides manual, purely visual tab-colour markers without using Chrome tab groups.

Chrome does not expose arbitrary per-tab background colours to extensions. Native tab-strip colours are properties of tab groups, and groups are interactive/collapsible. That behaviour conflicts with Agent Tabs' goal of being visual-only.

V0.1 therefore uses a favicon override as the colour marker.

## User interaction

1. Right-click a tab in Chrome's tab strip.
2. Choose **Colour > <colour>**.
3. Agent Tabs temporarily receives access to that tab from the explicit context-menu gesture.
4. It injects a small rounded-square SVG favicon in the selected colour.
5. Choosing **Colour > Remove colour** removes that override and restores the site's ordinary favicon selection.

The marker has no browser control semantics. It cannot collapse, expand, group, move, or otherwise affect tabs when clicked.

## Context-menu constraint

Chrome automatically collapses multiple visible menu items from one extension into a single extension-owned parent. To avoid the previous **Agent Tabs > Colour > ...** nesting, V0.1 exposes exactly one top-level extension item named **Colour**, with the nine choices underneath it.

## Browser APIs

V0.1 uses:

- `chrome.contextMenus` with the Chrome 150+ `tab` context.
- `activeTab` for temporary page access after the user's explicit context-menu gesture.
- `chrome.scripting.executeScript()` to add/remove the favicon marker.
- `chrome.storage.session` to remember the chosen colour for the lifetime of the browser tab.
- `chrome.tabs.onUpdated` to reapply the marker after same-origin reloads/navigation while temporary access remains valid.

## Permissions

Required permissions:

- `activeTab`
- `contextMenus`
- `scripting`
- `storage`

Persistent host permissions: none.

The extension does not need access to all websites at install time. Selecting a context-menu item is an explicit user gesture that grants temporary access to the selected tab. The injected function only adds or removes a favicon link; it does not inspect prompt/response text or send page data elsewhere.

## Persistence boundary

The colour assignment is tab-session state. It is reapplied across same-origin reloads/navigation when Chrome retains `activeTab` access. A cross-origin navigation revokes that temporary access, so the user may need to assign the colour again on the new site.

Longer-lived persistence can be considered later, but should not require broad host permissions unless there is a demonstrated need.

## Next milestone

V0.2 will add optional agent-state detection. That work remains separate because passive working/complete detection requires site-specific observation and a different permission/security boundary.
