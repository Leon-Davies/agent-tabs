# Agent Tabs

Agent Tabs is a small Chrome extension for visually organising tabs used for ChatGPT agents or other long-running work.

Give each tab a colour, then see when ChatGPT is working or has finished without opening every tab.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `agent-tabs` folder containing `manifest.json`.
6. Refresh any ChatGPT tabs that were already open.

Requires Chrome 150 or newer.

## Use

Right-click a tab and choose:

**Colour > choose a colour**

The selected colour replaces the tab favicon and is purely visual — it does not create or collapse Chrome tab groups.

Choose **Colour > Remove colour** to restore the normal favicon.

## ChatGPT states

On coloured ChatGPT tabs, a small status dot is shown automatically:

- 🟡 **Yellow** — ChatGPT is working / generating.
- 🟢 **Green** — ChatGPT finished while the tab was in the background and is ready to view.
- 🔴 **Red** — ChatGPT appears to have encountered an error.
- **No dot** — idle or already viewed.

## Privacy

Agent Tabs has no backend, analytics, or remote data collection. ChatGPT page access is used only to detect the coarse working/ready/error state.
