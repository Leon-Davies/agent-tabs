import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOURS,
  MENU_IDS,
  applyColourToTab,
  colourFromMenuId,
  forgetTab,
  getStoredTabState,
  installContextMenus,
  reapplyStoredColour,
  removeColourFromTab,
  setTabState,
  stateStorageKey,
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

test("applies a marker with current state and remembers the colour", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) {
        calls.push(["executeScript", properties]);
        return [{ result: { markerInstalled: true } }];
      }
    },
    storage: {
      session: {
        async get(key) {
          return key === stateStorageKey(7) ? { [key]: "ready" } : {};
        },
        async set(value) { calls.push(["set", value]); }
      }
    }
  };

  await applyColourToTab(7, "purple", apis);
  assert.equal(calls[0][0], "executeScript");
  assert.deepEqual(calls[0][1].target, { tabId: 7 });
  assert.deepEqual(calls[0][1].args, [COLOURS.purple, "ready"]);
  assert.deepEqual(calls[1], ["set", { [storageKey(7)]: "purple" }]);
});

test("rejects unsupported colours", async () => {
  await assert.rejects(() => applyColourToTab(7, "chartreuse", {}), RangeError);
});

test("setTabState stores the state and redraws coloured tabs", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(["executeScript", properties]); }
    },
    storage: {
      session: {
        async set(value) { calls.push(["set", value]); },
        async get(key) {
          return key === storageKey(7) ? { [key]: "cyan" } : {};
        }
      }
    }
  };

  assert.equal(await setTabState(7, "working", apis), true);
  assert.deepEqual(calls[0], ["set", { [stateStorageKey(7)]: "working" }]);
  assert.equal(calls[1][0], "executeScript");
  assert.deepEqual(calls[1][1].args, [COLOURS.cyan, "working"]);
});

test("remove injects the restore operation and clears session colour", async () => {
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

test("reapplies a stored colour with the current state", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(properties); }
    },
    storage: {
      session: {
        async get(key) {
          if (key === storageKey(12)) {
            return { [key]: "cyan" };
          }
          if (key === stateStorageKey(12)) {
            return { [key]: "ready" };
          }
          return {};
        }
      }
    }
  };

  assert.equal(await reapplyStoredColour(12, apis), true);
  assert.deepEqual(calls[0].target, { tabId: 12 });
  assert.deepEqual(calls[0].args, [COLOURS.cyan, "ready"]);
});

test("getStoredTabState defaults to idle", async () => {
  assert.equal(await getStoredTabState(3, { get: async () => ({}) }), "idle");
});

test("forgets closed tab colour and state", async () => {
  const calls = [];
  await forgetTab(9, { async remove(keys) { calls.push(keys); } });
  assert.deepEqual(calls, [[storageKey(9), stateStorageKey(9)]]);
});
