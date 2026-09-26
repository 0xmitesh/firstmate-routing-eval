import { describe, expect, it } from "vitest";
import { filterProducts } from "../../src/catalog/filterProducts";
import type { Product } from "../../src/types";

const products: Product[] = [
  {
    id: "p1",
    name: "Mirror One",
    category: "mirror",
    priceCents: 10000,
    stock: 4,
    active: true,
  },
  {
    id: "p2",
    name: "Mirror Two",
    category: "mirror",
    priceCents: 25000,
    stock: 0,
    active: true,
  },
  {
    id: "p3",
    name: "Lamp",
    category: "lighting",
    priceCents: 5000,
    stock: 10,
    active: true,
  },
  {
    id: "p4",
    name: "Retired Mirror",
    category: "mirror",
    priceCents: 7000,
    stock: 2,
    active: false,
  },
];

describe("filterProducts", () => {
  it("filters by category", () => {
    expect(
      filterProducts(products, { category: "mirror" }).map((p) => p.id),
    ).toEqual(["p1", "p2"]);
  });

  it("filters by price range", () => {
    expect(
      filterProducts(products, {
        minPriceCents: 6000,
        maxPriceCents: 15000,
      }).map((p) => p.id),
    ).toEqual(["p1"]);
  });

  it("can exclude out-of-stock products", () => {
    expect(
      filterProducts(products, {
        category: "mirror",
        inStockOnly: true,
      }).map((p) => p.id),
    ).toEqual(["p1"]);
  });
});
