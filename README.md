# Agent Tabs

**Version 0.6.0**

Agent Tabs is a lightweight Chrome extension for people who run several ChatGPT agents or coding conversations at once. It makes each tab easier to identify, shows what ChatGPT is doing, records when a response arrived, and can play a colour-specific note whenever a coloured agent finishes.

Manual colour markers work on normal Chrome tabs too; automatic status, timing and completion-chime features are currently ChatGPT-specific.

![Agent Tabs with multiple coloured tabs](docs/images/overview.png)

## What's new in 0.6

Version 0.6 turns the tab colour into both a visual and audible identity for a ChatGPT conversation:

- the palette has expanded from 9 to **15 colours**
- colours are ordered from **darkest to lightest** in the selection menu
- completion notes follow that same order: **dark colours = lower notes, light colours = higher notes**
- coloured ChatGPT tabs chime when a response finishes in either the foreground or background
- **Volume** and **pitch spacing** can be adjusted from a dedicated sound-settings page
- any colour can be previewed immediately without waiting for a ChatGPT response

The six new colours are **Black, Navy, Brown, Teal, Lime and Cream**. Existing colour values and saved assignments remain compatible with earlier versions.

## Features

### Persistent tab colours

Right-click any tab → **Colour** → choose a colour.

Agent Tabs provides 15 colours. The menu is ordered from the darkest colour to the lightest:

`Black → Navy → Brown → Pink → Purple → Teal → Red → Blue → Green → Orange → Grey → Cyan → Lime → Yellow → Cream`

This same order drives the completion-note scale: darker colours produce lower notes and lighter colours produce higher notes.

Colours are purely visual: Agent Tabs does not create Chrome tab groups. Assignments are stored locally so they survive refreshes and extension reloads. ChatGPT colours are remembered by conversation, so reopening the same conversation can restore its colour.

Use **Colour → Remove colour** to return to the automatic ChatGPT status light or the site's normal favicon.

### Live ChatGPT status lights

ChatGPT tabs show their current state automatically, even if you have not assigned a manual colour:

- 🟡 **Yellow** — ChatGPT is working / generating
- 🟢 **Green** — a response finished in the background and is ready for your attention
- 🔴 **Red** — the tab is idle / already viewed
- 🔴 **Red with `!`** — an error was detected

When a manual colour is assigned, the status appears as a small badge on top of the colour marker.

### Colour-coded completion chimes

When a manually coloured ChatGPT tab finishes a response, Agent Tabs plays one short note. The note pitch follows the 15-colour dark-to-light scale, making it possible to learn which agent has finished without looking at the tab strip.

- both foreground and background completions produce a chime
- only manually coloured ChatGPT tabs produce a chime
- one response completion produces one note
- removing the manual colour also removes its completion chime
- right-click a coloured tab → **Preview colour sound** to hear its note immediately

#### Sound settings

Right-click any tab → **Sound settings…** to open the Agent Tabs sound controls.

You can adjust:

- **Volume** — 0–100%, with a default of 55%
- **Pitch spacing** — 0.5–2.5 semitones between neighbouring colours, with a default of 1.25 semitones; increasing this makes adjacent colour notes easier to distinguish

Black is the base note at 220 Hz. The other colours rise from that base according to their position in the dark-to-light palette and your chosen pitch spacing.

The settings page shows the complete colour → frequency scale and lets you preview any selected colour. Changes are stored locally and take effect for subsequent previews and completion chimes.

The tones are synthesized locally as short WAV sounds and played through Chrome's offscreen-audio capability. Agent Tabs does not download or transmit audio.

### Response timestamps

Newly completed ChatGPT responses receive a small timestamp such as:

`Received 17:39:26`

Agent Tabs also extends the page title, which means Chrome's tab hover card can show useful timing information such as:

- `Working for 2m 13s`
- `Last response: 17:39:26 · 4m ago`

This is particularly useful when several agents are running at once and you want to know which one has just finished.

### Local and lightweight

Agent Tabs has no backend, analytics or remote data collection. Colour assignments, response timing and sound settings are stored locally by the extension. Prompt and response content is not stored or transmitted by Agent Tabs.

The extension uses Chrome's offscreen-document capability only to play the short locally generated completion note when required.

## Install

### Option 1 — Clone the repository

```bash
git clone https://github.com/Leon-Davies/agent-tabs.git
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

## Updating

If you cloned the repository:

```bash
git pull origin main
```

Then open `chrome://extensions`, click **Reload** on Agent Tabs, and refresh any open ChatGPT tabs.

If you installed from a ZIP, download the latest ZIP and replace/reload your local extension folder.

## Status examples

| Working | Ready |
| --- | --- |
| ![Working state](docs/images/state-working.png) | ![Ready state](docs/images/state-ready.png) |
