import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../contexts';
import { useApp, useIsFavorite } from '../contexts/AppContext';
import type { RootStackParamList, Product } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

/**
 * DetailsScreen - Display detailed product information
 * Requirements: 1.4, 4.1, 4.3, 4.2, 4.4, 4.5
 */
export default function DetailsScreen({ navigation, route }: DetailsScreenProps) {
  const { theme } = useTheme();
  const { toggleFavorite } = useApp();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Extract product data from route params
  const { product }: { product: Product } = route.params;

  // Check if this product is favorited
  const isFavorite = useIsFavorite(product.id);

  // Get screen dimensions for responsive layout
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 768;

  // Set up navigation header with back functionality
  useEffect(() => {
    navigation.setOptions({
      title: 'Product Details',
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: theme.colors.surface,
      },
      headerTintColor: theme.colors.text,
      headerTitleStyle: {
        color: theme.colors.text,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          testID="back-button"
          style={{ padding: 8 }}
        >
          <Text style={{ color: theme.colors.text, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme.colors.surface, theme.colors.text]);

  // Handle image loading states
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Handle favorites toggle with enhanced error handling and user feedback
  const handleFavoriteToggle = async () => {
    if (isTogglingFavorite) return; // Prevent multiple rapid taps

    setIsTogglingFavorite(true);

    try {
      await toggleFavorite(product.id);
      // Visual feedback is handled by the state change through useIsFavorite hook

      // Provide subtle success feedback
      const action = isFavorite ? 'removed from' : 'added to';
      console.log(`Product ${action} favorites successfully`);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);

      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to update favorites. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          errorMessage = 'Unable to save favorites. Please check your device storage and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Connection issue while saving favorites. Your preference will be saved when connection is restored.';
        }
      }

      Alert.alert(
        'Favorites Error',
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => handleFavoriteToggle(), style: 'default' }
        ]
      );
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        isTablet && styles.tabletContentContainer
      ]}
      testID="details-container"
    >
      {/* Product Image Section */}
      <View style={[
        styles.imageContainer,
        { backgroundColor: theme.colors.surface },
        isTablet && styles.tabletImageContainer
      ]}>
        {!imageError ? (
          <Image
            source={{ uri: product.image }}
            style={[
              styles.productImage,
              { backgroundColor: theme.colors.background },
              isTablet && styles.tabletProductImage
            ]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
            testID="product-image"
          />
        ) : (
          <View style={[
            styles.placeholderContainer,
            { backgroundColor: theme.colors.border },
            isTablet && styles.tabletPlaceholderContainer
          ]} testID="image-placeholder">
            <Text style={[
              styles.placeholderText,
              { color: theme.colors.textSecondary }
            ]}>
              Image not available
            </Text>
          </View>
        )}

        {imageLoading && !imageError && (
          <View style={[
            styles.loadingOverlay,
            { backgroundColor: theme.colors.surface }
          ]}>
            <Text style={[
              styles.loadingText,
              { color: theme.colors.textSecondary }
            ]}>
              Loading image...
            </Text>
          </View>
        )}
      </View>

      {/* Product Information Section */}
      <View style={[
        styles.infoContainer,
        { backgroundColor: theme.colors.surface },
        isTablet && styles.tabletInfoContainer
      ]}>
        {/* Product Title */}
        <Text style={[
          styles.productTitle,
          { color: theme.colors.text },
          { fontSize: theme.typography.fontSize.xlarge },
          isTablet && styles.tabletProductTitle
        ]}>
          {product.title}
        </Text>

        {/* Product Price and Favorites Section */}
        <View style={styles.priceAndFavoritesContainer}>
          <Text style={[
            styles.productPrice,
            { color: theme.colors.primary },
            isTablet && styles.tabletProductPrice
          ]}>
            ${product.price.toFixed(2)}
          </Text>

          {/* Favorites Toggle Button */}
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              {
                backgroundColor: isFavorite ? theme.colors.primary : theme.colors.border,
                opacity: isTogglingFavorite ? 0.6 : 1
              },
              isTablet && styles.tabletFavoriteButton
            ]}
            onPress={handleFavoriteToggle}
            disabled={isTogglingFavorite}
            activeOpacity={0.7}
            testID="favorite-button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Text style={[
              styles.favoriteButtonText,
              {
                color: isFavorite ? '#FFFFFF' : theme.colors.textSecondary
              },
              isTablet && styles.tabletFavoriteButtonText
            ]}>
              {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Category */}
        <View style={styles.categoryContainer}>
          <Text style={[
            styles.categoryLabel,
            { color: theme.colors.textSecondary },
            { fontSize: theme.typography.fontSize.medium }
          ]}>
            Category:
          </Text>
          <Text style={[
            styles.productCategory,
            { color: theme.colors.text },
            { fontSize: theme.typography.fontSize.medium }
          ]}>
            {product.category}
          </Text>
        </View>

        {/* Product Rating (if available) */}
        {product.rating && (
          <View style={styles.ratingContainer}>
            <Text style={[
              styles.ratingText,
              { color: theme.colors.textSecondary },
              { fontSize: theme.typography.fontSize.medium }
            ]}>
              ⭐ {product.rating.rate.toFixed(1)} ({product.rating.count} reviews)
            </Text>
          </View>
        )}

        {/* Product Description */}
        <View style={styles.descriptionSection}>
          <Text style={[
            styles.sectionTitle,
            { color: theme.colors.text },
            { fontSize: theme.typography.fontSize.large },
            isTablet && styles.tabletSectionTitle
          ]}>
            Description
          </Text>
          <Text style={[
            styles.productDescription,
            { color: theme.colors.textSecondary },
            { fontSize: theme.typography.fontSize.medium },
            { lineHeight: theme.typography.lineHeight.medium },
            isTablet && styles.tabletProductDescription
          ]}>
            {product.description}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  tabletContentContainer: {
    paddingHorizontal: 40,
    maxWidth: 800,
    alignSelf: 'center',
  },

  // Image Container Styles
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2, // Android shadow
    shadowColor: '#000000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  tabletImageContainer: {
    margin: 24,
    maxHeight: 400,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  tabletProductImage: {
    height: 400,
  },
  placeholderContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabletPlaceholderContainer: {
    height: 400,
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },

  // Info Container Styles
  infoContainer: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2, // Android shadow
    shadowColor: '#000000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabletInfoContainer: {
    margin: 24,
    padding: 32,
  },

  // Product Title Styles
  productTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 30,
  },
  tabletProductTitle: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 16,
    textAlign: 'center',
  },

  // Product Price and Favorites Styles
  priceAndFavoritesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    minWidth: 120,
  },
  tabletProductPrice: {
    fontSize: 36,
  },
  favoriteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2, // Android shadow
    shadowColor: '#000000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 140,
    alignItems: 'center',
  },
  tabletFavoriteButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 160,
  },
  favoriteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabletFavoriteButtonText: {
    fontSize: 16,
  },

  // Category Styles
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryLabel: {
    fontWeight: '600',
    marginRight: 8,
  },
  productCategory: {
    textTransform: 'capitalize',
    fontWeight: '500',
  },

  // Rating Styles
  ratingContainer: {
    marginBottom: 16,
  },
  ratingText: {
    fontWeight: '500',
  },

  // Description Styles
  descriptionSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  tabletSectionTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  productDescription: {
    marginBottom: 16,
  },
  tabletProductDescription: {
    fontSize: 18,
    lineHeight: 28,
  },
});