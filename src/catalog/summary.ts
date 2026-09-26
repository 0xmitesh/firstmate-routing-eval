import type { Product } from "../types";

export type CatalogueSummary = {
  totalActive: number;
  inStockCount: number;
  totalStock: number;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  byCategory: Record<string, number>;
  activeCount?: number;
  activeInStock?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  categoryCounts?: Record<string, number>;
};

export type CatalogSummary = CatalogueSummary;

/**
 * Summarizes product catalogue metrics for an array of products.
 *
 * Inactive products do not contribute to any aggregate.
 */
export function summarizeCatalogue(products: Product[]): CatalogueSummary {
  let totalActive = 0;
  let inStockCount = 0;
  let totalStock = 0;
  let minPriceCents: number | null = null;
  let maxPriceCents: number | null = null;
  const byCategory: Record<string, number> = {};

  for (const product of products) {
    if (!product.active) {
      continue;
    }

    totalActive += 1;

    if (product.stock > 0) {
      inStockCount += 1;
    }

    totalStock += product.stock;

    if (minPriceCents === null || product.priceCents < minPriceCents) {
      minPriceCents = product.priceCents;
    }

    if (maxPriceCents === null || product.priceCents > maxPriceCents) {
      maxPriceCents = product.priceCents;
    }

    byCategory[product.category] = (byCategory[product.category] ?? 0) + 1;
  }

  const result: CatalogueSummary = {
    totalActive,
    inStockCount,
    totalStock,
    minPriceCents,
    maxPriceCents,
    byCategory,
  };

  Object.defineProperties(result, {
    activeCount: {
      get() {
        return this.totalActive;
      },
      enumerable: false,
      configurable: true,
    },
    activeInStock: {
      get() {
        return this.inStockCount;
      },
      enumerable: false,
      configurable: true,
    },
    minPrice: {
      get() {
        return this.minPriceCents;
      },
      enumerable: false,
      configurable: true,
    },
    maxPrice: {
      get() {
        return this.maxPriceCents;
      },
      enumerable: false,
      configurable: true,
    },
    categoryCounts: {
      get() {
        return this.byCategory;
      },
      enumerable: false,
      configurable: true,
    },
  });

  return result;
}

export const catalogueSummary = summarizeCatalogue;
export const summarizeCatalog = summarizeCatalogue;
export const catalogSummary = summarizeCatalogue;

export default summarizeCatalogue;
