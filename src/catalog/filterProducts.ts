import type { Product } from "../types";

export type ProductFilter = {
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStockOnly?: boolean;
};

export function filterProducts(
  products: Product[],
  filter: ProductFilter,
): Product[] {
  return products.filter((product) => {
    if (!product.active) return false;

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
}
