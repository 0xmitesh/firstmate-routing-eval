import { describe, expect, it } from "vitest";
import { can } from "../../src/security/permissions";

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
});
