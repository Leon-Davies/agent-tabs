import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOURS,
  COLOUR_ORDER,
  MENU_IDS,
  applyColourToTab,
  colourFromMenuId,
  forgetTab,
  getExplicitStoredTabState,
  getStoredTabState,
  installContextMenus,
  reapplyStoredMarker,
  removeColourFromTab,
  setTabState,
  stateStorageKey,
  storageKey
} from "../src/background/tab-marker.js";

test("menu ids map only supported colours", () => {
  assert.equal(colourFromMenuId(`${MENU_IDS.colourPrefix}purple`), "purple");
  assert.equal(colourFromMenuId(`${MENU_IDS.colourPrefix}cream`), "cream");
  assert.equal(colourFromMenuId(`${MENU_IDS.colourPrefix}not-a-colour`), null);
  assert.equal(colourFromMenuId(MENU_IDS.removeColour), null);
});

test("installs one top-level Colour menu with luminance-ordered colour children", async () => {
  const calls = [];
  const contextMenus = {
    async removeAll() { calls.push({ method: "removeAll" }); },
    async create(properties) { calls.push({ method: "create", properties }); }
  };

  await installContextMenus(contextMenus);
  const created = calls.filter((call) => call.method === "create");
  const topLevel = created.filter((call) => !call.properties.parentId);
  const colourChildren = created.filter((call) => String(call.properties.id).startsWith(MENU_IDS.colourPrefix));

  assert.equal(calls[0].method, "removeAll");
  assert.equal(topLevel.length, 1);
  assert.equal(topLevel[0].properties.id, MENU_IDS.colourRoot);
  assert.equal(topLevel[0].properties.title, "Colour");
  assert.equal(created.length, Object.keys(COLOURS).length + 3);
  assert.deepEqual(
    colourChildren.map((call) => call.properties.id),
    COLOUR_ORDER.map((colour) => `${MENU_IDS.colourPrefix}${colour}`)
  );
});

test("applies a coloured marker with current ChatGPT state", async () => {
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
  assert.deepEqual(calls[0][1].args, [COLOURS.purple, "ready"]);
  assert.deepEqual(calls[1], ["set", { [storageKey(7)]: "purple" }]);
});

test("manual colour on a non-ChatGPT tab has no automatic status badge", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) {
        calls.push(properties);
        return [{ result: { markerInstalled: true } }];
      }
    },
    storage: {
      session: {
        async get() { return {}; },
        async set() {}
      }
    }
  };

  await applyColourToTab(4, "blue", apis);
  assert.deepEqual(calls[0].args, [COLOURS.blue, null]);
});

test("rejects unsupported colours", async () => {
  await assert.rejects(() => applyColourToTab(7, "chartreuse", {}), RangeError);
});

test("setTabState renders a standalone status light without a manual colour", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(["executeScript", properties]); }
    },
    storage: {
      session: {
        async set(value) { calls.push(["set", value]); },
        async get() { return {}; }
      }
    }
  };

  assert.equal(await setTabState(7, "working", apis), true);
  assert.deepEqual(calls[0], ["set", { [stateStorageKey(7)]: "working" }]);
  assert.deepEqual(calls[1][1].args, [null, "working"]);
});

test("setTabState overlays state on a coloured tab", async () => {
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

  await setTabState(7, "idle", apis);
  assert.deepEqual(calls[1][1].args, [COLOURS.cyan, "idle"]);
});

test("removing a manual colour keeps the ChatGPT status light", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(["executeScript", properties]); }
    },
    storage: {
      session: {
        async remove(key) { calls.push(["remove", key]); },
        async get(key) {
          return key === stateStorageKey(7) ? { [key]: "ready" } : {};
        }
      }
    }
  };

  await removeColourFromTab(7, apis);
  assert.deepEqual(calls[0], ["remove", storageKey(7)]);
  assert.deepEqual(calls[1][1].args, [null, "ready"]);
});

test("removing a manual colour restores the favicon on a non-ChatGPT tab", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(["executeScript", properties]); }
    },
    storage: {
      session: {
        async remove(key) { calls.push(["remove", key]); },
        async get() { return {}; }
      }
    }
  };

  await removeColourFromTab(7, apis);
  assert.equal(calls[1][0], "executeScript");
  assert.equal(calls[1][1].args, undefined);
});

test("reapplies a standalone status light after ChatGPT reload", async () => {
  const calls = [];
  const apis = {
    scripting: {
      async executeScript(properties) { calls.push(properties); }
    },
    storage: {
      session: {
        async get(key) {
          if (key === stateStorageKey(12)) {
            return { [key]: "idle" };
          }
          return {};
        }
      }
    }
  };

  assert.equal(await reapplyStoredMarker(12, apis), true);
  assert.deepEqual(calls[0].args, [null, "idle"]);
});

test("reapplies manual colour without a status on non-ChatGPT tabs", async () => {
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
          return {};
        }
      }
    }
  };

  assert.equal(await reapplyStoredMarker(12, apis), true);
  assert.deepEqual(calls[0].args, [COLOURS.cyan, null]);
});

test("getStoredTabState defaults to idle while explicit state can be absent", async () => {
  const storage = { get: async () => ({}) };
  assert.equal(await getExplicitStoredTabState(3, storage), null);
  assert.equal(await getStoredTabState(3, storage), "idle");
});

test("forgets closed tab colour and state", async () => {
  const calls = [];
  await forgetTab(9, { async remove(keys) { calls.push(keys); } });
  assert.deepEqual(calls, [[storageKey(9), stateStorageKey(9)]]);
});
