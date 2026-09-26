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

  it("matches product names case-insensitively", () => {
    expect(filterProducts(products, { q: "mIrRoR" }).map((p) => p.id)).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("trims whitespace around the query", () => {
    expect(filterProducts(products, { q: "  One  " }).map((p) => p.id)).toEqual([
      "p1",
    ]);
  });

  it("treats an empty or whitespace-only query as no query", () => {
    const activeIds = ["p1", "p2", "p3"];
    expect(filterProducts(products, { q: "" }).map((p) => p.id)).toEqual(
      activeIds,
    );
    expect(filterProducts(products, { q: " \t\n " }).map((p) => p.id)).toEqual(
      activeIds,
    );
  });

  it("combines query, existing filters, and sorting", () => {
    const combinedProducts = [
      ...products,
      {
        ...products[1],
        id: "p5",
        name: "Mirror Three",
        priceCents: 15000,
        stock: 1,
      },
    ];

    expect(
      filterProducts(combinedProducts, {
        q: "  MIRROR ",
        category: "mirror",
        minPriceCents: 10000,
        maxPriceCents: 25000,
        inStockOnly: true,
        sort: "price-desc",
      }).map((p) => p.id),
    ).toEqual(["p5", "p1"]);
  });

  it("sorts by price or name and breaks ties by id", () => {
    const tiedProducts: Product[] = [
      {
        id: "z",
        name: "Mug",
        category: "kitchen",
        priceCents: 100,
        stock: 1,
        active: true,
      },
      {
        id: "a",
        name: "Plate",
        category: "kitchen",
        priceCents: 100,
        stock: 1,
        active: true,
      },
      {
        id: "b",
        name: "Mug",
        category: "kitchen",
        priceCents: 200,
        stock: 1,
        active: true,
      },
      {
        id: "c",
        name: "Plate",
        category: "kitchen",
        priceCents: 200,
        stock: 1,
        active: true,
      },
    ];

    expect(filterProducts(tiedProducts, { sort: "price-asc" }).map((p) => p.id))
      .toEqual(["a", "z", "b", "c"]);
    expect(filterProducts(tiedProducts, { sort: "price-desc" }).map((p) => p.id))
      .toEqual(["b", "c", "a", "z"]);
    expect(filterProducts(tiedProducts, { sort: "name-asc" }).map((p) => p.id))
      .toEqual(["b", "z", "a", "c"]);
  });

  it("does not mutate the input array when sorting", () => {
    const input = [...products];
    const originalOrder = input.map((p) => p.id);

    const sorted = filterProducts(input, { sort: "price-asc" });

    expect(sorted).not.toBe(input);
    expect(input.map((p) => p.id)).toEqual(originalOrder);
    expect(sorted.map((p) => p.id)).toEqual(["p3", "p1", "p2"]);
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
