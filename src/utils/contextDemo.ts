/**
 * Demo utilities for testing AppContext functionality
 * This file demonstrates how to use the AppContext in practice
 * Requirements: 2.1, 3.2, 3.3, 5.1, 5.2
 */

import { Product } from '../types';

/**
 * Sample product data for testing the AppContext
 * Requirements: 2.1
 */
export const sampleProducts: Product[] = [
    {
        id: 1,
        title: 'Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops',
        price: 109.95,
        description: 'Your perfect pack for everyday use and walks in the forest.',
        category: "men's clothing",
        image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
        rating: {
            rate: 3.9,
            count: 120
        }
    },
    {
        id: 2,
        title: 'Mens Casual Premium Slim Fit T-Shirts',
        price: 22.3,
        description: 'Slim-fitting style, contrast raglan long sleeve.',
        category: "men's clothing",
        image: 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg',
        rating: {
            rate: 4.1,
            count: 259
        }
    },
    {
        id: 3,
        title: 'Mens Cotton Jacket',
        price: 55.99,
        description: 'Great outerwear jackets for Spring/Autumn/Winter.',
        category: "men's clothing",
        image: 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg',
        rating: {
            rate: 4.7,
            count: 500
        }
    }
];

/**
 * Demo function showing how to use AppContext methods
 * This would typically be called from a component
 * Requirements: 2.1, 3.2, 3.3, 5.1, 5.2
 */
export const demoContextUsage = {
    /**
     * Example of loading products into the context
     */
    loadSampleProducts: (setProducts: (products: Product[]) => void) => {
        setProducts(sampleProducts);
    },

    /**
     * Example of searching products
     */
    searchProducts: (setSearchQuery: (query: string) => void, query: string) => {
        setSearchQuery(query);
    },

    /**
     * Example of managing favorites
     */
    manageFavorites: async (toggleFavorite: (id: number) => Promise<void>, productId: number) => {
        try {
            await toggleFavorite(productId);
            console.log(`Toggled favorite for product ${productId}`);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    },

    /**
     * Example of handling loading states
     */
    handleLoading: (setLoading: (loading: boolean) => void, isLoading: boolean) => {
        setLoading(isLoading);
    },

    /**
     * Example of error handling
     */
    handleError: (setError: (error: string | null) => void, errorMessage: string | null) => {
        setError(errorMessage);
    }
};

/**
 * Utility to filter products by search query (client-side filtering)
 * This demonstrates the search functionality requirement
 * Requirements: 3.2, 3.3
 */
export function filterProductsByQuery(products: Product[], query: string): Product[] {
    if (!query.trim()) {
        return products;
    }

    const lowercaseQuery = query.toLowerCase();
    return products.filter(product =>
        product.title.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
}

/**
 * Utility to check if a product is in favorites
 * Requirements: 5.1, 5.2
 */
export function isProductFavorite(productId: number, favorites: number[]): boolean {
    return favorites.includes(productId);
}

/**
 * Utility to get favorite products from a list
 * Requirements: 5.1, 5.2
 */
export function getFavoriteProducts(products: Product[], favorites: number[]): Product[] {
    return products.filter(product => favorites.includes(product.id));
}