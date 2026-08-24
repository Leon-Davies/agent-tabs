(function installAgentTabsTiming(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.AgentTabsTiming = api;
})(globalThis, () => {
  const TITLE_SUFFIX_PATTERN = /\s·\s(?:Working for|Last response:).+$/;

  function validTimestamp(value) {
    return Number.isFinite(value) && value > 0;
  }

  function plural(value, unit) {
    return `${value}${unit}`;
  }

  function formatRelativeAge(timestamp, now = Date.now()) {
    if (!validTimestamp(timestamp)) {
      return null;
    }

    const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    if (seconds < 10) {
      return "just now";
    }
    if (seconds < 60) {
      return `${plural(seconds, "s")} ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${plural(minutes, "m")} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${plural(hours, "h")} ago`;
    }

    return `${plural(Math.floor(hours / 24), "d")} ago`;
  }

  function formatDuration(startedAt, now = Date.now()) {
    if (!validTimestamp(startedAt)) {
      return null;
    }

    const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
    if (seconds < 60) {
      return plural(seconds, "s");
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0
        ? `${plural(minutes, "m")} ${plural(remainingSeconds, "s")}`
        : plural(minutes, "m");
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${plural(hours, "h")} ${plural(remainingMinutes, "m")}`
      : plural(hours, "h");
  }

  function formatClock(timestamp, locales) {
    if (!validTimestamp(timestamp)) {
      return null;
    }

    return new Date(timestamp).toLocaleTimeString(locales, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function stripTitleSuffix(title) {
    return String(title || "").replace(TITLE_SUFFIX_PATTERN, "").trim();
  }

  function buildTitle(baseTitle, timing, now = Date.now(), locales) {
    const base = stripTitleSuffix(baseTitle);

    if (timing?.phase === "working" && validTimestamp(timing.workingStartedAt)) {
      const duration = formatDuration(timing.workingStartedAt, now);
      return `${base} · Working for ${duration}`;
    }

    if (validTimestamp(timing?.lastResponseAt)) {
      const clock = formatClock(timing.lastResponseAt, locales);
      const age = formatRelativeAge(timing.lastResponseAt, now);
      return `${base} · Last response: ${clock} · ${age}`;
    }

    return base;
  }

  function conversationStorageKey(locationLike) {
    const origin = String(locationLike?.origin || "");
    const pathname = String(locationLike?.pathname || "/");
    return `agent-tabs-timing:${origin}${pathname}`;
  }

  return Object.freeze({
    buildTitle,
    conversationStorageKey,
    formatClock,
    formatDuration,
    formatRelativeAge,
    stripTitleSuffix
  });
});
