const MESSAGE_TYPE = "agent-tabs:chatgpt-signal";

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

let lastSignature = null;
let publishTimer = null;

function publish(force = false) {
  const phase = detectPhase();
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
window.addEventListener("pageshow", () => publish(true));
window.addEventListener("popstate", schedulePublish);

setInterval(() => publish(false), 1000);
publish(true);
