import { describe, expect, it } from "vitest";
import { Inventory } from "../../src/inventory/reservations";

describe("Inventory", () => {
  it("reserves and releases stock", () => {
    const inventory = new Inventory();

    inventory.setStock("mirror-1", 5);
    inventory.reserve({
      id: "r1",
      sku: "mirror-1",
      quantity: 2,
    });

    expect(inventory.available("mirror-1")).toBe(3);

    inventory.release("r1");

    expect(inventory.available("mirror-1")).toBe(5);
  });

  it("rejects reservations larger than available stock", () => {
    const inventory = new Inventory();

    inventory.setStock("mirror-1", 1);

    expect(() =>
      inventory.reserve({
        id: "r1",
        sku: "mirror-1",
        quantity: 2,
      }),
    ).toThrow("Insufficient stock");
  });
});
