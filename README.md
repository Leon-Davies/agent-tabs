# Agent Tabs

**Version 0.4.0**

Agent Tabs is a Chrome extension for keeping multiple ChatGPT agent tabs easy to distinguish at a glance. Assign colours to separate agents or tasks, while live status lights and response timestamps show which ChatGPT tabs are working and when they last replied.

Status lights work automatically on ChatGPT tabs even when no manual colour is assigned. Manual colourising also works on normal Chrome tabs.

![Agent Tabs with multiple coloured tabs](docs/images/overview.png)

## Install

### Option 1 — Clone the repository

```bash
git clone https://github.com/bigggs/agent-tabs.git
cd agent-tabs
```

### Option 2 — Download the ZIP

1. On GitHub, click the green **Code** button.
2. Click **Download ZIP**.
3. Extract the ZIP file.
4. Open the extracted `agent-tabs` folder.

![Download the ZIP from GitHub](docs/images/download-zip.png)

Then:

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the cloned or extracted `agent-tabs` folder.
5. Refresh any ChatGPT tabs that were already open.

Requires Chrome 150 or newer.

## Use

Right-click any tab → **Colour** → choose a colour.

Use **Colour → Remove colour** to remove the manual colour. ChatGPT tabs will keep their automatic status light.

ChatGPT status lights:

- 🟡 **Yellow** — working / generating
- 🟢 **Green** — finished in the background and ready for the next prompt
- 🔴 **Red** — seen, idle and not currently working

Errors use a red light with a white `!` marker.

Agent Tabs also adds a small `Received HH:MM:SS` timestamp to newly completed ChatGPT responses. The tab title is extended so Chrome's hover card shows either how long ChatGPT has been working or the time and age of the latest response, for example `Working for 2m 13s` or `Last response: 17:39:26 · 4m ago`.

Response timing is stored locally in the extension and no conversation content is stored or transmitted.

| Working | Ready |
| --- | --- |
| ![Working state](docs/images/state-working.png) | ![Ready state](docs/images/state-ready.png) |
