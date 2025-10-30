/**
 * Product interface matching fakestoreapi.com response structure
 * Requirements: 2.1, 4.3
 */
export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

/**
 * API error interface for handling API failures
 * Requirements: 2.1
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}