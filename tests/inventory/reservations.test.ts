import { describe, expect, it } from "vitest";
import { Inventory } from "../../src/inventory/reservations";

describe("Inventory reservations", () => {
  it("creates active reservations and deducts stock once", () => {
    const inventory = new Inventory();

    inventory.setStock("mirror-1", 5);
    inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 2 });

    expect(inventory.available("mirror-1")).toBe(3);
    expect(inventory.getReservation("r1")).toEqual({
      id: "r1",
      sku: "mirror-1",
      quantity: 2,
      state: "active",
    });

    expect(() =>
      inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 1 }),
    ).toThrow("Reservation already exists");
    expect(inventory.available("mirror-1")).toBe(3);
  });

  it("releases an active reservation once and makes repeated release idempotent", () => {
    const inventory = new Inventory();

    inventory.setStock("mirror-1", 5);
    inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 2 });

    inventory.release("r1");

    expect(inventory.available("mirror-1")).toBe(5);
    expect(inventory.getReservation("r1")?.state).toBe("released");

    inventory.release("r1");
    inventory.release("r1");

    expect(inventory.available("mirror-1")).toBe(5);
    expect(inventory.getReservation("r1")?.state).toBe("released");
    expect(() =>
      inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 1 }),
    ).toThrow("Reservation already exists");
    expect(inventory.available("mirror-1")).toBe(5);
  });

  it("commits an active reservation permanently without another stock change", () => {
    const inventory = new Inventory();

    inventory.setStock("mirror-1", 5);
    inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 2 });
    inventory.commit("r1");

    expect(inventory.available("mirror-1")).toBe(3);
    expect(inventory.getReservation("r1")?.state).toBe("committed");

    expect(() => inventory.release("r1")).toThrow(
      "Cannot release a committed reservation",
    );
    expect(() => inventory.commit("r1")).toThrow(
      "Cannot commit reservation in committed state",
    );
    expect(inventory.available("mirror-1")).toBe(3);
    expect(inventory.getReservation("r1")?.state).toBe("committed");
    expect(() =>
      inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 1 }),
    ).toThrow("Reservation already exists");
  });

  it("rejects committing a released reservation without changing stock", () => {
    const inventory = new Inventory();

    inventory.setStock("mirror-1", 5);
    inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 2 });
    inventory.release("r1");

    expect(() => inventory.commit("r1")).toThrow(
      "Cannot commit reservation in released state",
    );
    expect(inventory.available("mirror-1")).toBe(5);
    expect(inventory.getReservation("r1")?.state).toBe("released");

    inventory.release("r1");
    expect(inventory.available("mirror-1")).toBe(5);
  });

  it("reports unknown reservations and preserves release no-op behavior", () => {
    const inventory = new Inventory();

    expect(inventory.getReservation("missing")).toBeUndefined();
    inventory.release("missing");
    expect(() => inventory.commit("missing")).toThrow(
      "Cannot commit unknown reservation: missing",
    );
  });

  it("rejects reservations larger than available stock", () => {
    const inventory = new Inventory();

    inventory.setStock("mirror-1", 1);

    expect(() =>
      inventory.reserve({ id: "r1", sku: "mirror-1", quantity: 2 }),
    ).toThrow("Insufficient stock");
    expect(inventory.getReservation("r1")).toBeUndefined();
    expect(inventory.available("mirror-1")).toBe(1);
  });
});
