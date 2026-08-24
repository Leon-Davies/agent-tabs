import assert from "node:assert/strict";
import test from "node:test";

import {
  chatConversationKey,
  forgetPersistentTab,
  getPersistentColour,
  persistColour,
  persistentTabKey,
  removePersistentColour
} from "../src/background/colour-persistence.js";

function memoryStorage(initial = {}) {
  const values = { ...initial };
  return {
    values,
    async get(keys) {
      const result = {};
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (Object.hasOwn(values, key)) {
          result[key] = values[key];
        }
      }
      return result;
    },
    async set(entries) {
      Object.assign(values, entries);
    },
    async remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        delete values[key];
      }
    }
  };
}

test("normalises ChatGPT conversation URLs without query or hash", () => {
  const first = chatConversationKey("https://chatgpt.com/c/abc123?model=foo#bottom");
  const second = chatConversationKey("https://chatgpt.com/c/abc123/");
  assert.equal(first, second);
  assert.equal(chatConversationKey("https://example.com/c/abc123"), null);
});

test("persists colour by live tab and ChatGPT conversation", async () => {
  const storage = memoryStorage();
  const url = "https://chatgpt.com/c/abc123";

  assert.equal(await persistColour(7, "purple", url, storage), true);
  assert.equal(storage.values[persistentTabKey(7)], "purple");
  assert.equal(storage.values[chatConversationKey(url)], "purple");
});

test("restores a colour from the conversation when tab id changes", async () => {
  const url = "https://chatgpt.com/c/abc123";
  const storage = memoryStorage({ [chatConversationKey(url)]: "cyan" });

  assert.equal(await getPersistentColour(99, url, storage), "cyan");
});

test("tab mapping takes precedence over conversation mapping", async () => {
  const url = "https://chatgpt.com/c/abc123";
  const storage = memoryStorage({
    [persistentTabKey(12)]: "orange",
    [chatConversationKey(url)]: "blue"
  });

  assert.equal(await getPersistentColour(12, url, storage), "orange");
});

test("removing colour clears both current tab and conversation mapping", async () => {
  const url = "https://chatgpt.com/c/abc123";
  const storage = memoryStorage({
    [persistentTabKey(12)]: "orange",
    [chatConversationKey(url)]: "orange"
  });

  assert.equal(await removePersistentColour(12, url, storage), true);
  assert.equal(await getPersistentColour(12, url, storage), null);
});

test("closing a tab forgets only its numeric mapping", async () => {
  const url = "https://chatgpt.com/c/abc123";
  const storage = memoryStorage({
    [persistentTabKey(12)]: "green",
    [chatConversationKey(url)]: "green"
  });

  assert.equal(await forgetPersistentTab(12, storage), true);
  assert.equal(storage.values[persistentTabKey(12)], undefined);
  assert.equal(storage.values[chatConversationKey(url)], "green");
});
