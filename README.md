# Agent Tabs

Agent Tabs is a small Chrome extension for visually organizing browser tabs used as long-running AI or agent workspaces.

It is intentionally generic: colours and future status indicators are not tied to any particular project, AI provider, or workflow.

## V0.1 — visual tab colour markers

V0.1 adds a native tab-strip context menu:

**Right-click tab > Colour > choose a colour**

Available colours:

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

### How it works

Chrome does not expose an extension API for painting an arbitrary individual tab background. Native tab colours belong to Chrome tab groups, which also means they are interactive/collapsible.

Agent Tabs deliberately does **not** create tab groups. Instead, the selected colour is rendered as a small rounded-square favicon marker in the tab's icon position. The marker is purely visual: clicking it cannot collapse, expand, move, or group tabs.

The colour is remembered for the life of the browser tab and is reapplied after same-origin reloads/navigation when Chrome still grants the extension temporary access to that tab.

## Privacy and permissions

V0.1 requests:

- `activeTab`
- `contextMenus`
- `scripting`
- `storage`

It requests **no persistent host permissions** and makes no network requests. Page access is granted temporarily only when the user explicitly chooses an Agent Tabs context-menu command. The extension only injects/removes its favicon marker; it does not read or store page text, prompts, responses, or browsing history.

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
- **V0.2:** optional working/response-ready state detection
- **V0.3:** read/unread state and resilient detector hardening
- Later: optional generic agent metadata/dashboard, only if it proves useful

## Development principles

- Manifest V3
- No framework or build step unless justified later
- No backend
- Minimal permissions
- No analytics or remote data collection
- Generic project and agent semantics
