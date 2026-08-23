# Architecture

## V0.3 scope

V0.3 makes ChatGPT state lights independent from manual tab colours and gives idle/seen tabs an explicit red state light.

The design keeps two separate visual concerns:

- **manual identity** — an optional user-selected colour for any Chrome tab;
- **automatic state** — a ChatGPT-only status light shown whether or not a manual colour exists.

## State model

ChatGPT states remain:

- `working`
- `ready`
- `idle`
- `error`

Visual mapping:

- `working` -> yellow
- `ready` -> green
- `idle` -> red
- `error` -> red with a white `!` marker

When a manual colour is present, the state is shown as a small lower-right badge. Without a manual colour, the favicon becomes a standalone state light.

## State transitions

- a visible stop/cancel-generation control implies `working`;
- when a previously working tab becomes idle while hidden, it becomes `ready`;
- viewing a `ready` tab returns it to `idle`;
- a visible error alert maps to `error`.

The detector is a heuristic UI integration rather than an OpenAI product API integration.

## Browser architecture

### Background service worker

The service worker:

- installs the tab-strip context menu;
- remembers manual colours and ChatGPT states in `chrome.storage.session`;
- receives coarse state signals from the ChatGPT content script;
- applies the state transition function;
- renders the current state on every ChatGPT signal so uncoloured tabs also receive a status light;
- reapplies stored colour/state markers after reloads.

### ChatGPT content script

A static content script runs only on:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

It observes the ChatGPT DOM, visibility/focus events and a low-frequency safety poll. It emits only coarse state signals and does not persist prompt or response text.

### Favicon renderer

The renderer suppresses the page favicon while Agent Tabs owns the visual marker and generates a PNG favicon:

- manual colour only for non-ChatGPT coloured tabs;
- manual colour plus status badge for coloured ChatGPT tabs;
- standalone status light for uncoloured ChatGPT tabs.

Removing a manual colour from a ChatGPT tab preserves its status light. Removing a colour from a normal tab restores the site's favicon.

## Permissions

Extension permissions:

- `activeTab`
- `contextMenus`
- `scripting`
- `storage`

Persistent host permissions remain limited to:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

Non-ChatGPT manual colouring continues to use temporary `activeTab` access.

## Known constraints

- ChatGPT state detection depends on DOM heuristics and may require maintenance when OpenAI changes the UI.
- State lights are ChatGPT-specific; other sites support manual colours only.
