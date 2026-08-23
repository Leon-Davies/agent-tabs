import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOURS,
  MENU_IDS,
  TAB_GROUP_ID_NONE,
  applyColourToTab,
  colourFromMenuId,
  installContextMenus,
  removeColourFromTab
} from "../src/background/tab-colour.js";

test("menu ids map only supported colours", () => {
  assert.equal(colourFromMenuId(`${MENU_IDS.colourPrefix}purple`), "purple");
  assert.equal(colourFromMenuId(`${MENU_IDS.colourPrefix}not-a-colour`), null);
  assert.equal(colourFromMenuId(MENU_IDS.removeColour), null);
});

test("installs a tab-only nested context menu", async () => {
  const calls = [];
  const contextMenus = {
    async removeAll() {
      calls.push({ method: "removeAll" });
    },
    async create(properties) {
      calls.push({ method: "create", properties });
    }
  };

  await installContextMenus(contextMenus);

  assert.equal(calls[0].method, "removeAll");
  const created = calls.filter((call) => call.method === "create");
  assert.equal(created.length, COLOURS.length + 3);
  assert.ok(created.every((call) => call.properties.contexts?.includes("tab")));
  assert.deepEqual(
    created
      .filter((call) =>
        String(call.properties.id).startsWith(MENU_IDS.colourPrefix) &&
        call.properties.id !== MENU_IDS.colourRoot
      )
      .map((call) => call.properties.id),
    COLOURS.map((colour) => `${MENU_IDS.colourPrefix}${colour}`)
  );
});

test("groups an ungrouped tab and applies its colour", async () => {
  const calls = [];
  const apis = {
    tabs: {
      async group(properties) {
        calls.push(["group", properties]);
        return 42;
      },
      async query() {
        throw new Error("query should not be called for an ungrouped tab");
      },
      async ungroup() {
        throw new Error("ungroup should not be called for an ungrouped tab");
      }
    },
    tabGroups: {
      async update(groupId, properties) {
        calls.push(["update", groupId, properties]);
      }
    }
  };

  const groupId = await applyColourToTab(
    { id: 7, groupId: TAB_GROUP_ID_NONE },
    "purple",
    apis
  );

  assert.equal(groupId, 42);
  assert.deepEqual(calls, [
    ["group", { tabIds: 7 }],
    ["update", 42, { color: "purple" }]
  ]);
});

test("recolours an existing one-tab group without rebuilding it", async () => {
  const calls = [];
  const apis = {
    tabs: {
      async query(properties) {
        calls.push(["query", properties]);
        return [{ id: 7, groupId: 12 }];
      },
      async group() {
        throw new Error("group should not be called for a one-tab group");
      },
      async ungroup() {
        throw new Error("ungroup should not be called for a one-tab group");
      }
    },
    tabGroups: {
      async update(groupId, properties) {
        calls.push(["update", groupId, properties]);
      }
    }
  };

  await applyColourToTab({ id: 7, groupId: 12 }, "green", apis);

  assert.deepEqual(calls, [
    ["query", { groupId: 12 }],
    ["update", 12, { color: "green" }]
  ]);
});

test("detaches a tab from a multi-tab group before colouring it", async () => {
  const calls = [];
  const apis = {
    tabs: {
      async query(properties) {
        calls.push(["query", properties]);
        return [
          { id: 7, groupId: 12 },
          { id: 8, groupId: 12 }
        ];
      },
      async ungroup(tabId) {
        calls.push(["ungroup", tabId]);
      },
      async group(properties) {
        calls.push(["group", properties]);
        return 99;
      }
    },
    tabGroups: {
      async update(groupId, properties) {
        calls.push(["update", groupId, properties]);
      }
    }
  };

  const groupId = await applyColourToTab({ id: 7, groupId: 12 }, "orange", apis);

  assert.equal(groupId, 99);
  assert.deepEqual(calls, [
    ["query", { groupId: 12 }],
    ["ungroup", 7],
    ["group", { tabIds: 7 }],
    ["update", 99, { color: "orange" }]
  ]);
});

test("remove colour ungroups a grouped tab", async () => {
  const calls = [];
  const tabsApi = {
    async ungroup(tabId) {
      calls.push(tabId);
    }
  };

  assert.equal(await removeColourFromTab({ id: 7, groupId: 12 }, tabsApi), true);
  assert.deepEqual(calls, [7]);
});

test("remove colour is a no-op for an ungrouped tab", async () => {
  const tabsApi = {
    async ungroup() {
      throw new Error("should not ungroup an ungrouped tab");
    }
  };

  assert.equal(
    await removeColourFromTab({ id: 7, groupId: TAB_GROUP_ID_NONE }, tabsApi),
    false
  );
});
