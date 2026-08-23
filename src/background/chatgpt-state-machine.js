export const PHASES = Object.freeze({
  idle: "idle",
  working: "working",
  error: "error"
});

export const TAB_STATES = Object.freeze({
  idle: "idle",
  working: "working",
  ready: "ready",
  error: "error"
});

export function isKnownTabState(value) {
  return Object.values(TAB_STATES).includes(value);
}

export function deriveTabState(previousState, phase, visible) {
  if (phase === PHASES.working) {
    return TAB_STATES.working;
  }

  if (phase === PHASES.error) {
    return TAB_STATES.error;
  }

  if (phase !== PHASES.idle) {
    return isKnownTabState(previousState) ? previousState : TAB_STATES.idle;
  }

  if (previousState === TAB_STATES.working) {
    return visible ? TAB_STATES.idle : TAB_STATES.ready;
  }

  if (previousState === TAB_STATES.ready) {
    return visible ? TAB_STATES.idle : TAB_STATES.ready;
  }

  if (previousState === TAB_STATES.error) {
    return TAB_STATES.idle;
  }

  return TAB_STATES.idle;
}
