# Agent Tabs

Agent Tabs is a small Chrome extension for visually organizing browser tabs used as long-running AI or agent workspaces.

It is intentionally generic: colours and future status indicators are not tied to any particular project, AI provider, or workflow.

## V0.1 — manual tab colours

V0.1 adds a native tab-strip context menu:

**Right-click tab > Agent Tabs > Colour > choose a colour**

Available colours are Chrome's native tab-group colours:

- Grey
- Blue
- Red
- Yellow
- Green
- Pink
- Purple
- Cyan
- Orange

Choose **Agent Tabs > Remove colour** to remove the individual colour.

### How it works

Chrome does not provide extensions with an API for painting an arbitrary individual tab background. Agent Tabs uses a one-tab native Chrome tab group instead. This keeps the visual treatment native to Chrome.

If a tab is already in a multi-tab group, applying an individual Agent Tabs colour detaches that one tab and puts it into its own coloured group. See [`docs/architecture.md`](docs/architecture.md) for the design details and trade-offs.

## Privacy and permissions

V0.1 requests only:

- `contextMenus`
- `tabGroups`

It requests **no host permissions**, has no content script, makes no network requests, and does not read webpage content.

## Requirements

- Google Chrome 150 or newer

Chrome 150 introduced extension entries in the native tab-strip right-click menu.

## Load the development extension

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository root (the directory containing `manifest.json`).
6. Right-click any normal Chrome tab and look for **Agent Tabs**.

After changing extension code, use the **Reload** button on the Agent Tabs card in `chrome://extensions`.

## Run tests

The test suite has no third-party dependencies. With a current Node.js installation:

```bash
node --test tests/*.test.mjs
```

## Roadmap

- **V0.1:** manual native tab colour assignment
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
