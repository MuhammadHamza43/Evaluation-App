import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Product } from './Product';

/**
 * Navigation parameter types for type-safe screen routing
 * Requirements: 1.1, 1.3, 4.3
 */
export type RootStackParamList = {
  Home: undefined;
  Details: {
    product: Product;
  };
};

/**
 * Navigation prop types for screens
 * Requirements: 1.1, 1.3, 4.3
 */
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

/**
 * Screen names enum for consistent navigation
 * Requirements: 4.3
 */
export enum ScreenNames {
  HOME = 'Home',
  DETAILS = 'Details',
}