/**
 * Data transformation utilities for product data
 * Requirements: 2.1 - Product data transformation utilities
 */

import { Product } from '../types';

/**
 * Format price for display with currency symbol
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

/**
 * Format rating for display
 */
export const formatRating = (rating: { rate: number; count: number }): string => {
  return `${rating.rate.toFixed(1)} (${rating.count} reviews)`;
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Filter products by search query (case-insensitive)
 */
export const filterProductsByQuery = (products: Product[], query: string): Product[] => {
  if (!query.trim()) {
    return products;
  }
  
  const lowercaseQuery = query.toLowerCase().trim();
  return products.filter(product =>
    product.title.toLowerCase().includes(lowercaseQuery) ||
    product.category.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery)
  );
};

/**
 * Sort products by different criteria
 */
export const sortProducts = (
  products: Product[], 
  sortBy: 'title' | 'price' | 'rating' = 'title',
  order: 'asc' | 'desc' = 'asc'
): Product[] => {
  return [...products].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'rating':
        comparison = a.rating.rate - b.rating.rate;
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Get unique categories from products array
 */
export const getUniqueCategories = (products: Product[]): string[] => {
  const categories = products.map(product => product.category);
  return Array.from(new Set(categories)).sort();
};

/**
 * Validate product data structure
 */
export const isValidProduct = (product: unknown): product is Product => {
  if (!product || typeof product !== 'object') {
    return false;
  }
  
  const p = product as Record<string, unknown>;
  
  if (
    typeof p.id !== 'number' ||
    typeof p.title !== 'string' ||
    typeof p.price !== 'number' ||
    typeof p.description !== 'string' ||
    typeof p.category !== 'string' ||
    typeof p.image !== 'string' ||
    !p.rating ||
    typeof p.rating !== 'object'
  ) {
    return false;
  }
  
  const rating = p.rating as Record<string, unknown>;
  return (
    typeof rating.rate === 'number' &&
    typeof rating.count === 'number'
  );
};