import { describe, expect, it } from "vitest";
import { allowedActions, can, type Action } from "../../src/security/permissions";

describe("permissions", () => {
  it("limits viewers to catalogue reads", () => {
    const viewer = {
      id: "u1",
      role: "viewer" as const,
    };

    expect(can(viewer, "catalog:read")).toBe(true);
    expect(can(viewer, "catalog:write")).toBe(false);
  });

  it("allows admins to perform every action", () => {
    const admin = {
      id: "u2",
      role: "admin" as const,
    };

    expect(can(admin, "catalog:write")).toBe(true);
    expect(can(admin, "inventory:reserve")).toBe(true);
    expect(can(admin, "admin:manage")).toBe(true);
  });

  it.each([
    ["viewer", ["catalog:read"]],
    ["editor", ["catalog:read", "catalog:write", "inventory:reserve"]],
    [
      "admin",
      ["catalog:read", "catalog:write", "inventory:reserve", "admin:manage"],
    ],
  ] as const)("lists every action allowed for a %s", (role, expected) => {
    const user = { id: `user-${role}`, role };

    expect(allowedActions(user)).toEqual(expected);
  });

  it("returns actions in a stable order without sharing result arrays", () => {
    const editor = { id: "u3", role: "editor" as const };
    const first = allowedActions(editor);
    const second = allowedActions(editor);

    expect(first).toEqual(["catalog:read", "catalog:write", "inventory:reserve"]);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });

  it("keeps can available with its existing authorization behavior", () => {
    const actions: Action[] = [
      "catalog:read",
      "catalog:write",
      "inventory:reserve",
      "admin:manage",
    ];
    const expectedByRole = {
      viewer: [true, false, false, false],
      editor: [true, true, true, false],
      admin: [true, true, true, true],
    } as const;

    for (const role of ["viewer", "editor", "admin"] as const) {
      const user = { id: `user-${role}`, role };
      expect(actions.map((action) => can(user, action))).toEqual(expectedByRole[role]);
    }
  });
});
