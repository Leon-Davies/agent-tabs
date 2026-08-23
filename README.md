# Agent Tabs

Agent Tabs is a small Chrome extension for visually organizing browser tabs used as long-running AI or agent workspaces.

It is intentionally generic: manual colours and state indicators are not tied to any particular project or workflow.

## V0.2 — manual colours + ChatGPT state badges

Agent Tabs now supports two visual layers:

- a **manual colour** that you assign from the tab-strip context menu;
- an automatic **ChatGPT state badge** on coloured ChatGPT tabs.

The manual interaction remains:

**Right-click tab > Colour > choose a colour**

Available manual colours:

- Grey
- Blue
- Red
- Yellow
- Green
- Pink
- Purple
- Cyan
- Orange

Choose **Colour > Remove colour** to restore the site's normal favicon.

## ChatGPT state badges

On manually coloured ChatGPT tabs, Agent Tabs overlays a small badge on the colour marker:

- **Yellow badge** — ChatGPT is currently working / generating.
- **Green badge** — ChatGPT finished while the tab was in the background and now needs your attention.
- **Red badge** — ChatGPT appears to have produced an error.
- **No badge** — idle / already viewed.

V0.2 limits automatic state detection to ChatGPT (`chatgpt.com` and the legacy `chat.openai.com` host).

## How it works

Chrome does not provide extensions with an API for painting an arbitrary individual tab background outside native tab groups. Agent Tabs therefore uses a purely visual favicon replacement instead.

The extension temporarily suppresses the page's existing favicon declaration, generates its own colour marker, and restores the original favicon when you remove the colour.

For ChatGPT tabs, a narrowly scoped content script observes coarse UI signals such as the visible generation stop/cancel control, error alerts, and tab visibility. It reports only the resulting coarse state to the extension service worker; prompts and responses are not stored or transmitted.

## Privacy and permissions

Agent Tabs requests:

- `activeTab`
- `contextMenus`
- `scripting`
- `storage`

Persistent host access is limited to:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

That ChatGPT-specific access is required for passive state detection and for updating the visual badge after generation completes. The extension has no backend, no analytics, and no remote data collection.

For non-ChatGPT sites, manual colouring still uses the temporary `activeTab` permission granted by your explicit context-menu action.

## Requirements

- Google Chrome 150 or newer

Chrome 150 introduced extension entries in the native tab-strip right-click menu.

## Load the development extension

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository root (the directory containing `manifest.json`).
6. Right-click any normal Chrome tab and look for **Colour**.

After changing extension code, use the **Reload** button on the Agent Tabs card in `chrome://extensions`.

## Run tests

The test suite has no third-party dependencies. With a current Node.js installation:

```bash
node --test tests/*.test.mjs
```

## Roadmap

- **V0.1:** manual pure-visual colour marker
- **V0.2:** ChatGPT working / ready / error badges
- **V0.3:** detector hardening and any read/unread refinements justified by testing
- Later: optional additional AI providers and generic agent metadata/dashboard

## Development principles

- Manifest V3
- No framework or build step unless justified later
- No backend
- Minimal permissions
- No analytics or remote data collection
- Generic project and agent semantics
