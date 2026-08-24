const MESSAGE_TYPE = "agent-tabs:chatgpt-signal";
const FOOTER_ATTRIBUTE = "data-agent-tabs-response-time";
const MAX_STORED_MESSAGE_TIMES = 100;
const timing = globalThis.AgentTabsTiming;

if (!timing) {
  throw new Error("Agent Tabs timing helpers were not loaded.");
}

function isVisibleElement(element) {
  if (!element) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function buttonLikeText(element) {
  return [
    element.getAttribute("aria-label") || "",
    element.getAttribute("title") || "",
    element.textContent || ""
  ].join(" ").trim();
}

function hasStopSignal() {
  const directSelectors = [
    'button[aria-label*="stop" i]',
    'button[title*="stop" i]',
    '[data-testid*="stop" i]',
    'button[aria-label*="cancel" i]'
  ];

  const directMatches = Array.from(
    document.querySelectorAll(directSelectors.join(","))
  );

  if (directMatches.some(isVisibleElement)) {
    return true;
  }

  return Array.from(document.querySelectorAll("button")).some((button) => {
    if (!isVisibleElement(button)) {
      return false;
    }

    const text = buttonLikeText(button);
    return /\bstop\b/i.test(text) || /\bcancel\b/i.test(text);
  });
}

function hasErrorSignal() {
  const candidates = Array.from(
    document.querySelectorAll('[role="alert"], [data-testid*="error" i]')
  );

  return candidates.some((element) => {
    if (!isVisibleElement(element)) {
      return false;
    }

    return /something went wrong|error occurred|network error|failed to generate/i.test(
      element.textContent || ""
    );
  });
}

function detectPhase() {
  if (hasErrorSignal()) {
    return "error";
  }

  if (hasStopSignal()) {
    return "working";
  }

  return "idle";
}

function assistantTurns() {
  const selectors = [
    '[data-message-author-role="assistant"]',
    'article[data-turn="assistant"]',
    '[data-turn="assistant"]'
  ];
  const seen = new Set();
  const turns = [];

  for (const element of document.querySelectorAll(selectors.join(","))) {
    const target = element.closest("article") || element;
    if (!seen.has(target)) {
      seen.add(target);
      turns.push(target);
    }
  }

  return turns;
}

function messageIdForTurn(turn) {
  const elementWithId = turn.matches?.("[data-message-id]")
    ? turn
    : turn.closest?.("[data-message-id]") || turn.querySelector?.("[data-message-id]");
  const id = elementWithId?.getAttribute("data-message-id");
  return id || null;
}

function ensureFooterStyles() {
  if (document.getElementById("agent-tabs-response-time-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "agent-tabs-response-time-style";
  style.textContent = `
    [${FOOTER_ATTRIBUTE}] {
      margin-top: 0.45rem;
      font-size: 0.72rem;
      line-height: 1.2;
      text-align: right;
      opacity: 0.58;
      color: currentColor;
      user-select: text;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function addResponseFooter(turn, receivedAt) {
  if (!turn || !Number.isFinite(receivedAt)) {
    return false;
  }

  ensureFooterStyles();
  let footer = turn.querySelector?.(`[${FOOTER_ATTRIBUTE}]`);
  if (!footer) {
    footer = document.createElement("div");
    footer.setAttribute(FOOTER_ATTRIBUTE, "");
    footer.setAttribute("aria-label", "Agent Tabs response timestamp");
    turn.appendChild(footer);
  }

  const clock = timing.formatClock(receivedAt);
  footer.textContent = `Received ${clock}`;
  footer.title = new Date(receivedAt).toLocaleString();
  footer.dataset.receivedAt = String(receivedAt);
  return true;
}

let currentStorageKey = null;
let timingRecord = { lastResponseAt: null, messageTimes: {} };
let conversationLoadToken = 0;
let lastPhase = null;
let workingStartedAt = null;
let baseTitle = timing.stripTitleSuffix(document.title);
let lastAppliedTitle = null;
let lastSignature = null;
let publishTimer = null;

function normaliseTimingRecord(value) {
  const lastResponseAt = Number(value?.lastResponseAt);
  const messageTimes = {};

  if (value?.messageTimes && typeof value.messageTimes === "object") {
    for (const [messageId, timestamp] of Object.entries(value.messageTimes)) {
      const numericTimestamp = Number(timestamp);
      if (messageId && Number.isFinite(numericTimestamp) && numericTimestamp > 0) {
        messageTimes[messageId] = numericTimestamp;
      }
    }
  }

  return {
    lastResponseAt: Number.isFinite(lastResponseAt) && lastResponseAt > 0
      ? lastResponseAt
      : null,
    messageTimes
  };
}

async function ensureConversationTimingLoaded() {
  const nextKey = timing.conversationStorageKey(window.location);
  if (nextKey === currentStorageKey) {
    return;
  }

  currentStorageKey = nextKey;
  const loadToken = ++conversationLoadToken;
  timingRecord = { lastResponseAt: null, messageTimes: {} };
  baseTitle = timing.stripTitleSuffix(document.title);

  try {
    const stored = await chrome.storage.local.get(nextKey);
    if (loadToken !== conversationLoadToken || nextKey !== currentStorageKey) {
      return;
    }

    timingRecord = normaliseTimingRecord(stored[nextKey]);
    restoreStoredFooters();
    updateTabTitle();
  } catch {
    // Timing is an enhancement; state lights should continue if storage fails.
  }
}

async function persistTimingRecord() {
  if (!currentStorageKey) {
    await ensureConversationTimingLoaded();
  }

  if (!currentStorageKey) {
    return;
  }

  try {
    await chrome.storage.local.set({ [currentStorageKey]: timingRecord });
  } catch {
    // Do not let timestamp persistence interfere with ChatGPT state detection.
  }
}

function restoreStoredFooters() {
  for (const turn of assistantTurns()) {
    const messageId = messageIdForTurn(turn);
    const receivedAt = messageId ? timingRecord.messageTimes[messageId] : null;
    if (receivedAt) {
      addResponseFooter(turn, receivedAt);
    }
  }
}

function trimMessageTimes() {
  const entries = Object.entries(timingRecord.messageTimes)
    .sort((left, right) => right[1] - left[1])
    .slice(0, MAX_STORED_MESSAGE_TIMES);
  timingRecord.messageTimes = Object.fromEntries(entries);
}

async function markLatestResponseReceived(receivedAt = Date.now()) {
  await ensureConversationTimingLoaded();
  const turns = assistantTurns();
  const latestTurn = turns.at(-1);

  timingRecord.lastResponseAt = receivedAt;

  if (latestTurn) {
    addResponseFooter(latestTurn, receivedAt);
    const messageId = messageIdForTurn(latestTurn);
    if (messageId) {
      timingRecord.messageTimes[messageId] = receivedAt;
      trimMessageTimes();
    }
  }

  await persistTimingRecord();
  updateTabTitle();
}

function updateTabTitle(now = Date.now()) {
  if (document.title !== lastAppliedTitle) {
    baseTitle = timing.stripTitleSuffix(document.title) || baseTitle;
  }

  const desiredTitle = timing.buildTitle(
    baseTitle,
    {
      phase: lastPhase,
      workingStartedAt,
      lastResponseAt: timingRecord.lastResponseAt
    },
    now
  );

  if (desiredTitle && document.title !== desiredTitle) {
    lastAppliedTitle = desiredTitle;
    document.title = desiredTitle;
  }
}

function handlePhaseTransition(phase) {
  const previousPhase = lastPhase;

  if (phase === "working" && previousPhase !== "working") {
    workingStartedAt = Date.now();
  }

  if (previousPhase === "working" && phase === "idle") {
    workingStartedAt = null;
    markLatestResponseReceived(Date.now()).catch(() => {});
  } else if (previousPhase === "working" && phase !== "working") {
    workingStartedAt = null;
  }

  lastPhase = phase;
  updateTabTitle();
}

function publish(force = false) {
  const phase = detectPhase();
  handlePhaseTransition(phase);

  const visible = !document.hidden;
  const signature = `${phase}|${visible}`;

  if (!force && signature === lastSignature) {
    return;
  }

  lastSignature = signature;
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPE,
    phase,
    visible
  }).catch(() => {});
}

function schedulePublish() {
  if (publishTimer) {
    clearTimeout(publishTimer);
  }

  publishTimer = setTimeout(() => {
    publishTimer = null;
    restoreStoredFooters();
    publish(false);
  }, 150);
}

const observer = new MutationObserver(schedulePublish);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true
});

window.addEventListener("visibilitychange", () => publish(true));
window.addEventListener("focus", () => publish(true));
window.addEventListener("pageshow", () => {
  ensureConversationTimingLoaded().catch(() => {});
  publish(true);
});
window.addEventListener("popstate", () => {
  ensureConversationTimingLoaded().catch(() => {});
  schedulePublish();
});

setInterval(() => {
  ensureConversationTimingLoaded().catch(() => {});
  updateTabTitle();
  publish(false);
}, 1000);

ensureConversationTimingLoaded().catch(() => {});
publish(true);
