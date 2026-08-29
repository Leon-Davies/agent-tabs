import { COLOURS } from "./palette.js";

const PERSISTENT_TAB_PREFIX = "agent-tabs-persistent-colour:tab:";
const PERSISTENT_CHAT_PREFIX = "agent-tabs-persistent-colour:chat:";

export function persistentTabKey(tabId) {
  return `${PERSISTENT_TAB_PREFIX}${tabId}`;
}

export function chatConversationKey(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== "chatgpt.com" && hostname !== "chat.openai.com") {
      return null;
    }

    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${PERSISTENT_CHAT_PREFIX}${parsed.origin}${pathname}`;
  } catch {
    return null;
  }
}

function validColour(value) {
  return Object.hasOwn(COLOURS, value) ? value : null;
}

export async function persistColour(tabId, colour, url, storage = chrome.storage.local) {
  if (!Number.isInteger(tabId) || !validColour(colour)) {
    return false;
  }

  const values = {
    [persistentTabKey(tabId)]: colour
  };
  const conversationKey = chatConversationKey(url);
  if (conversationKey) {
    values[conversationKey] = colour;
  }

  await storage.set(values);
  return true;
}

export async function getPersistentColour(tabId, url, storage = chrome.storage.local) {
  if (!Number.isInteger(tabId)) {
    return null;
  }

  const tabKey = persistentTabKey(tabId);
  const conversationKey = chatConversationKey(url);
  const keys = conversationKey ? [tabKey, conversationKey] : [tabKey];
  const stored = await storage.get(keys);

  return validColour(stored[tabKey]) ||
    (conversationKey ? validColour(stored[conversationKey]) : null);
}

export async function removePersistentColour(tabId, url, storage = chrome.storage.local) {
  if (!Number.isInteger(tabId)) {
    return false;
  }

  const keys = [persistentTabKey(tabId)];
  const conversationKey = chatConversationKey(url);
  if (conversationKey) {
    keys.push(conversationKey);
  }

  await storage.remove(keys);
  return true;
}

export async function forgetPersistentTab(tabId, storage = chrome.storage.local) {
  if (!Number.isInteger(tabId)) {
    return false;
  }

  // Keep the ChatGPT conversation mapping so reopening the conversation can
  // restore its colour, but discard the numeric tab mapping because Chrome may
  // reuse tab IDs later.
  await storage.remove(persistentTabKey(tabId));
  return true;
}
