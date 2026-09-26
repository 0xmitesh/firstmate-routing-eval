import type { Product } from "../types";

export type ProductSort = "price-asc" | "price-desc" | "name-asc";

export type ProductFilter = {
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStockOnly?: boolean;
  q?: string;
  sort?: ProductSort;
};

function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function filterProducts(
  products: Product[],
  filter: ProductFilter,
): Product[] {
  const query = filter.q?.trim().toLowerCase();
  const filtered = products.filter((product) => {
    if (!product.active) return false;

    if (query && !product.name.toLowerCase().includes(query)) {
      return false;
    }

    if (filter.category && product.category !== filter.category) {
      return false;
    }

    if (
      filter.minPriceCents !== undefined &&
      product.priceCents < filter.minPriceCents
    ) {
      return false;
    }

    if (
      filter.maxPriceCents !== undefined &&
      product.priceCents > filter.maxPriceCents
    ) {
      return false;
    }

    if (filter.inStockOnly && product.stock <= 0) {
      return false;
    }

    return true;
  });

  if (!filter.sort) return filtered;

  return filtered.sort((a, b) => {
    let comparison = 0;
    if (filter.sort === "price-asc") {
      comparison = a.priceCents - b.priceCents;
    } else if (filter.sort === "price-desc") {
      comparison = b.priceCents - a.priceCents;
    } else if (filter.sort === "name-asc") {
      comparison = compareStrings(a.name, b.name);
    }

    return comparison || compareStrings(a.id, b.id);
  });
}
