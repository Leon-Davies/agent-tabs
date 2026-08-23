# Architecture

## V0.2 scope

V0.2 keeps the purely visual manual tab-colour marker and adds automatic state badges for ChatGPT tabs.

The design deliberately separates two concerns:

- **manual identity** — the user chooses a colour for a tab;
- **automatic state** — ChatGPT activity is mapped to a coarse badge state.

## User interaction

1. Right-click a tab in Chrome's tab strip.
2. Choose **Colour > <colour>**.
3. Agent Tabs replaces the page favicon with a generated colour marker.
4. On ChatGPT tabs, Agent Tabs overlays a small state badge on that marker.
5. Choose **Colour > Remove colour** to restore the site's original favicon.

The marker is still purely visual and creates no Chrome tab groups.

## State model

V0.2 distinguishes four ChatGPT tab states:

- `working`
- `ready`
- `idle`
- `error`

The transition policy is intentionally small:

- a visible stop/cancel-generation control implies `working`;
- when a previously working tab becomes idle while hidden, it becomes `ready`;
- viewing a `ready` tab returns it to `idle`;
- a visible error alert maps to `error`.

This is a heuristic UI detector rather than an OpenAI product API integration.

## Browser architecture

### Background service worker

The service worker is responsible for:

- installing the tab-strip context menu;
- remembering manual colours in `chrome.storage.session`;
- remembering current ChatGPT tab state in `chrome.storage.session`;
- receiving state signals from the ChatGPT content script;
- applying the state transition function;
- regenerating the favicon marker when state changes.

### ChatGPT content script

A static content script runs only on:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

It watches the ChatGPT DOM with a `MutationObserver`, plus visibility/focus events and a low-frequency safety poll. It emits only coarse signals (`working`, `idle`, `error`) plus whether the document is visible.

The detector does not persist prompt or response text and does not send page content to any server.

### Favicon renderer

The existing V0.1 renderer remains the visual foundation. It:

- suppresses the page's active favicon declaration;
- generates a PNG rounded-square marker in the manual colour;
- optionally draws a small state badge in the lower-right corner;
- observes favicon mutations so SPA metadata changes do not overwrite the marker;
- restores the site's original favicon when the colour is removed.

Badge mapping:

- `working` -> yellow
- `ready` -> green
- `error` -> red
- `idle` -> no badge

## Permissions

Extension permissions:

- `activeTab`
- `contextMenus`
- `scripting`
- `storage`

Persistent host permissions are intentionally limited to:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

This persistent ChatGPT scope is necessary because automatic state transitions must update background tabs without requiring another user gesture. Non-ChatGPT manual colouring continues to rely on temporary `activeTab` access.

## Known constraints

- ChatGPT state detection depends on DOM heuristics and may require maintenance when OpenAI changes the UI.
- V0.2 deliberately does not distinguish tool-use, reasoning, streaming, paused, or other internal sub-states.
- State badges are shown only when a manual colour marker exists; uncoloured ChatGPT tabs retain their ordinary favicon.
- Non-ChatGPT pages remain manual-colour-only in this milestone.

## Next milestone

V0.3 should harden the detector using evidence from real multi-tab testing, then decide whether additional providers or richer states provide enough value to justify the extra maintenance surface.
