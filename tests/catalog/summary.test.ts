import { describe, expect, it } from "vitest";
import defaultSummarizeCatalogue, {
  catalogSummary,
  catalogueSummary,
  summarizeCatalog,
  summarizeCatalogue,
} from "../../src/catalog/summary";
import { summarizeCatalogue as summarizeFromCatalogueSummary } from "../../src/catalog/catalogueSummary";
import { summarizeCatalogue as summarizeFromCatalogSummary } from "../../src/catalog/catalogSummary";
import type { Product } from "../../src/types";

describe("summarizeCatalogue", () => {
  it("calculates all aggregates correctly for a mixed product catalogue", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Floor Lamp",
        category: "lighting",
        priceCents: 4500,
        stock: 5,
        active: true,
      },
      {
        id: "p2",
        name: "Desk Lamp",
        category: "lighting",
        priceCents: 2500,
        stock: 0,
        active: true,
      },
      {
        id: "p3",
        name: "Wall Mirror",
        category: "mirror",
        priceCents: 12000,
        stock: 3,
        active: true,
      },
      {
        id: "p4",
        name: "Full Length Mirror",
        category: "mirror",
        priceCents: 18000,
        stock: 2,
        active: true,
      },
      {
        id: "p5",
        name: "Discontinued Mirror",
        category: "mirror",
        priceCents: 1000,
        stock: 20,
        active: false,
      },
    ];

    const summary = summarizeCatalogue(products);

    expect(summary).toEqual({
      totalActive: 4,
      inStockCount: 3,
      totalStock: 10,
      minPriceCents: 2500,
      maxPriceCents: 18000,
      byCategory: {
        lighting: 2,
        mirror: 2,
      },
    });

    // Verify getter aliases
    expect(summary.activeCount).toBe(4);
    expect(summary.activeInStock).toBe(3);
    expect(summary.minPrice).toBe(2500);
    expect(summary.maxPrice).toBe(18000);
    expect(summary.categoryCounts).toEqual({
      lighting: 2,
      mirror: 2,
    });
  });

  it("handles empty input", () => {
    const summary = summarizeCatalogue([]);

    expect(summary).toEqual({
      totalActive: 0,
      inStockCount: 0,
      totalStock: 0,
      minPriceCents: null,
      maxPriceCents: null,
      byCategory: {},
    });
  });

  it("handles all-inactive input", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Archived Sofa",
        category: "furniture",
        priceCents: 50000,
        stock: 12,
        active: false,
      },
      {
        id: "p2",
        name: "Retired Rug",
        category: "decor",
        priceCents: 15000,
        stock: 4,
        active: false,
      },
    ];

    const summary = summarizeCatalogue(products);

    expect(summary).toEqual({
      totalActive: 0,
      inStockCount: 0,
      totalStock: 0,
      minPriceCents: null,
      maxPriceCents: null,
      byCategory: {},
    });
  });

  it("correctly groups counts by category", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Table",
        category: "furniture",
        priceCents: 30000,
        stock: 2,
        active: true,
      },
      {
        id: "p2",
        name: "Chair",
        category: "furniture",
        priceCents: 12000,
        stock: 8,
        active: true,
      },
      {
        id: "p3",
        name: "Desk",
        category: "furniture",
        priceCents: 22000,
        stock: 1,
        active: true,
      },
      {
        id: "p4",
        name: "Ceiling Light",
        category: "lighting",
        priceCents: 8500,
        stock: 0,
        active: true,
      },
      {
        id: "p5",
        name: "Rug",
        category: "textiles",
        priceCents: 6000,
        stock: 3,
        active: true,
      },
      {
        id: "p6",
        name: "Inactive Bed",
        category: "bedroom",
        priceCents: 90000,
        stock: 5,
        active: false,
      },
    ];

    const summary = summarizeCatalogue(products);

    expect(summary.byCategory).toEqual({
      furniture: 3,
      lighting: 1,
      textiles: 1,
    });
    expect(summary.byCategory).not.toHaveProperty("bedroom");
  });

  it("strictly excludes inactive products from all aggregates", () => {
    const products: Product[] = [
      {
        id: "active-1",
        name: "Active Standard",
        category: "tools",
        priceCents: 5000,
        stock: 4,
        active: true,
      },
      {
        id: "active-2",
        name: "Active Premium",
        category: "tools",
        priceCents: 15000,
        stock: 0,
        active: true,
      },
      {
        id: "inactive-cheapest",
        name: "Inactive Super Cheap",
        category: "tools",
        priceCents: 100, // lower than active minimum (5000)
        stock: 100,
        active: false,
      },
      {
        id: "inactive-expensive",
        name: "Inactive Expensive",
        category: "tools",
        priceCents: 999999, // higher than active maximum (15000)
        stock: 50,
        active: false,
      },
      {
        id: "inactive-unique-category",
        name: "Inactive Unique",
        category: "special-clearance",
        priceCents: 4000,
        stock: 200,
        active: false,
      },
    ];

    const summary = summarizeCatalogue(products);

    expect(summary.totalActive).toBe(2);
    expect(summary.inStockCount).toBe(1);
    expect(summary.totalStock).toBe(4);
    expect(summary.minPriceCents).toBe(5000);
    expect(summary.maxPriceCents).toBe(15000);
    expect(summary.byCategory).toEqual({
      tools: 2,
    });
    expect(summary.byCategory).not.toHaveProperty("special-clearance");
  });

  it("handles a single active product where min and max prices match", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Solo Item",
        category: "general",
        priceCents: 3500,
        stock: 7,
        active: true,
      },
    ];

    const summary = summarizeCatalogue(products);

    expect(summary.totalActive).toBe(1);
    expect(summary.inStockCount).toBe(1);
    expect(summary.totalStock).toBe(7);
    expect(summary.minPriceCents).toBe(3500);
    expect(summary.maxPriceCents).toBe(3500);
    expect(summary.byCategory).toEqual({ general: 1 });
  });

  it("handles products with zero price correctly without treating zero as null", () => {
    const products: Product[] = [
      {
        id: "p-free",
        name: "Free Sample",
        category: "samples",
        priceCents: 0,
        stock: 10,
        active: true,
      },
      {
        id: "p-paid",
        name: "Paid Item",
        category: "samples",
        priceCents: 2000,
        stock: 5,
        active: true,
      },
    ];

    const summary = summarizeCatalogue(products);

    expect(summary.minPriceCents).toBe(0);
    expect(summary.maxPriceCents).toBe(2000);
  });

  it("does not mutate the input array or its objects", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Item 1",
        category: "cat",
        priceCents: 1000,
        stock: 2,
        active: true,
      },
      {
        id: "p2",
        name: "Item 2",
        category: "cat",
        priceCents: 2000,
        stock: 0,
        active: false,
      },
    ];

    const originalCopy = JSON.parse(JSON.stringify(products));

    summarizeCatalogue(products);

    expect(products).toEqual(originalCopy);
  });

  it("provides compatible aliases and module exports", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Item",
        category: "cat",
        priceCents: 1200,
        stock: 3,
        active: true,
      },
    ];

    const expected = summarizeCatalogue(products);

    expect(catalogueSummary(products)).toEqual(expected);
    expect(summarizeCatalog(products)).toEqual(expected);
    expect(catalogSummary(products)).toEqual(expected);
    expect(defaultSummarizeCatalogue(products)).toEqual(expected);
    expect(summarizeFromCatalogueSummary(products)).toEqual(expected);
    expect(summarizeFromCatalogSummary(products)).toEqual(expected);
  });
});
