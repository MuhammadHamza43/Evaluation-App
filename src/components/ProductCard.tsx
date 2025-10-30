import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Dimensions 
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../types';

/**
 * ProductCard component props interface
 * Requirements: 2.3, 4.4
 */
interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  style?: ViewStyle;
}

/**
 * ProductCard Component
 * Displays product information with image, title, and price
 * Includes image loading with placeholder fallback and touch handling
 * Requirements: 2.3, 4.4
 */
const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - theme.spacing.md * 3) / 2; // 2 columns with margins

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handlePress = () => {
    onPress(product);
  };

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: theme.spacing.sm,
      margin: theme.spacing.xs,
      width: cardWidth,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    imageContainer: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    placeholderText: {
      fontSize: 24,
      color: theme.colors.textSecondary,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    loadingText: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    contentContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.fontSize.medium,
      fontWeight: theme.typography.fontWeight.bold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      lineHeight: theme.typography.lineHeight.medium,
    },
    price: {
      fontSize: theme.typography.fontSize.large,
      fontWeight: theme.typography.fontWeight.bold as any,
      color: theme.colors.primary,
      marginTop: 'auto',
    },
    category: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      textTransform: 'capitalize',
    },
  });

  return (
    <TouchableOpacity
      style={[dynamicStyles.card, style]}
      onPress={handlePress}
      testID="product-card"
      activeOpacity={0.8}
    >
      <View style={dynamicStyles.imageContainer}>
        {!imageError ? (
          <>
            <Image
              source={{ uri: product.image }}
              style={dynamicStyles.productImage}
              onError={handleImageError}
              onLoad={handleImageLoad}
              testID="product-image"
            />
            {imageLoading && (
              <View style={dynamicStyles.loadingContainer}>
                <Text style={dynamicStyles.loadingText}>Loading...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={dynamicStyles.placeholderContainer} testID="image-placeholder">
            <Text style={dynamicStyles.placeholderText}>📦</Text>
          </View>
        )}
      </View>
      
      <View style={dynamicStyles.contentContainer}>
        <Text style={dynamicStyles.category} testID="product-category">
          {product.category}
        </Text>
        <Text 
          style={dynamicStyles.title} 
          numberOfLines={2}
          testID="product-title"
        >
          {product.title}
        </Text>
        <Text style={dynamicStyles.price} testID="product-price">
          ${product.price.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Memoize ProductCard to prevent unnecessary re-renders
// Only re-render when product data changes (shallow comparison is sufficient for product object)
export const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  // Since product objects are immutable from API, we can do shallow comparison
  return (
    prevProps.product === nextProps.product &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.style === nextProps.style
  );
});

export default ProductCard;