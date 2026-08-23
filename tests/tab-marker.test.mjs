import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOURS,
  MENU_IDS,
  applyColourToTab,
  colourFromMenuId,
  forgetTab,
  installContextMenus,
  reapplyStoredColour,
  removeColourFromTab,
  storageKey
} from "../src/background/tab-marker.js";

test("menu ids map only supported colours", () => {
  assert.equal(colourFromMenuId(`${MENU_IDS.colourPrefix}purple`), "purple");
  assert.equal(colourFromMenuId(`${MENU_IDS.colourPrefix}not-a-colour`), null);
  assert.equal(colourFromMenuId(MENU_IDS.removeColour), null);
});

test("installs one top-level Colour menu with colour children", async () => {
  const calls = [];
  const contextMenus = {
    async removeAll() { calls.push({ method: "removeAll" }); },
    async create(properties) { calls.push({ method: "create", properties }); }
  };

  await installContextMenus(contextMenus);
  const created = calls.filter((call) => call.method === "create");
  const topLevel = created.filter((call) => !call.properties.parentId);

  assert.equal(calls[0].method, "removeAll");
  assert.equal(topLevel.length, 1);
  assert.equal(topLevel[0].properties.id, MENU_IDS.colourRoot);
  assert.equal(topLevel[0].properties.title, "Colour");
  assert.equal(created.length, Object.keys(COLOURS).length + 3);
});

test("applies a marker with scripting and remembers the colour", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(["executeScript", properties]); }
    },
    storage: {
      session: {
        async set(value) { calls.push(["set", value]); }
      }
    }
  };

  await applyColourToTab(7, "purple", apis);
  assert.equal(calls[0][0], "executeScript");
  assert.deepEqual(calls[0][1].target, { tabId: 7 });
  assert.deepEqual(calls[0][1].args, [COLOURS.purple]);
  assert.deepEqual(calls[1], ["set", { [storageKey(7)]: "purple" }]);
});

test("rejects unsupported colours", async () => {
  await assert.rejects(() => applyColourToTab(7, "chartreuse", {}), RangeError);
});

test("remove injects the restore operation and clears session state", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(["executeScript", properties]); }
    },
    storage: {
      session: {
        async remove(key) { calls.push(["remove", key]); }
      }
    }
  };

  await removeColourFromTab(7, apis);
  assert.equal(calls[0][0], "executeScript");
  assert.deepEqual(calls[0][1].target, { tabId: 7 });
  assert.deepEqual(calls[1], ["remove", storageKey(7)]);
});

test("reapplies a stored colour after a same-origin page reload", async () => {
  const calls = [];
  const key = storageKey(12);
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(properties); }
    },
    storage: {
      session: {
        async get(requestedKey) {
          assert.equal(requestedKey, key);
          return { [key]: "cyan" };
        }
      }
    }
  };

  assert.equal(await reapplyStoredColour(12, apis), true);
  assert.deepEqual(calls[0].target, { tabId: 12 });
  assert.deepEqual(calls[0].args, [COLOURS.cyan]);
});

test("does nothing when no valid stored colour exists", async () => {
  const key = storageKey(12);
  const apis = {
    scripting: { async executeScript() { throw new Error("must not run"); } },
    storage: { session: { async get() { return { [key]: "bad" }; } } }
  };

  assert.equal(await reapplyStoredColour(12, apis), false);
});

test("forgets closed tab state", async () => {
  const calls = [];
  await forgetTab(9, { async remove(key) { calls.push(key); } });
  assert.deepEqual(calls, [storageKey(9)]);
});
