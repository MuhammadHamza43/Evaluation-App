# ProductCatalogApp

A React Native mobile application built with Expo that provides a product catalog with favorites functionality, theme switching, and offline support.

## 🚀 Features

- **Product Catalog**: Browse products with images, titles, and prices
- **Product Details**: View detailed product information
- **Favorites System**: Add/remove products from favorites with persistence
- **Theme Switching**: Toggle between light and dark themes
- **Search Functionality**: Real-time product search with debouncing
- **Offline Support**: Graceful handling of network conditions
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Data Persistence**: Favorites and theme preferences persist across app restarts

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **Expo CLI**: Install globally with `npm install -g @expo/cli`
- **Expo Go app** on your mobile device (for testing)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd ProductCatalogApp

# Install dependencies
npm install
```

### 2. Start the Development Server

```bash
# Start Expo development server
npm start

# Alternative commands:
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
```

### 3. Run on Device

1. Install **Expo Go** app on your mobile device
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

## 🧪 Testing

The project includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## 🔧 Development Commands

```bash
# Linting
npm run lint          # Check for linting errors
npm run lint:fix      # Fix linting errors automatically

# Type checking
npm run type-check    # Run TypeScript type checking
```

## 🏗️ Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/        # React Context providers (Theme, App state)
├── hooks/           # Custom React hooks
├── navigation/      # Navigation configuration
├── screens/         # Screen components (Home, Details, etc.)
├── services/        # API and data services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── __tests__/       # Test files
```

## 🎨 Design Decisions

### Architecture Patterns

- **Context API**: Used for global state management (theme, favorites)
- **Custom Hooks**: Encapsulate business logic and state management
- **Error Boundaries**: Multiple levels of error handling for robust UX
- **Repository Pattern**: Abstracted data access layer for API and storage

### UI/UX Decisions

- **Theme System**: Comprehensive light/dark theme support with system preference detection
- **Navigation**: Stack-based navigation with React Navigation v7
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Loading States**: Skeleton screens and loading indicators for better perceived performance

### Performance Optimizations

- **Image Caching**: Efficient image loading with fallback placeholders
- **Search Debouncing**: Prevents excessive API calls during search
- **Memoization**: Strategic use of React.memo and useMemo for performance
- **Lazy Loading**: Components loaded on demand where appropriate

### Data Management

- **AsyncStorage**: Local persistence for favorites and user preferences
- **Error Recovery**: Automatic retry mechanisms for failed network requests
- **Offline Support**: Graceful degradation when network is unavailable
- **Data Validation**: Input validation and sanitization throughout the app

## 🌐 Public Expo Project

**Expo Project URL**: `https://expo.dev/accounts/hamza198/projects/product-catalog-app`

*Note: Replace with actual Expo project URL once published*

To publish the project:
```bash
expo publish
```

## ⏱️ Development Time Breakdown

### Phase 1: Project Setup & Core Structure (4-6 hours)
- Initial Expo project setup and configuration
- TypeScript configuration and linting setup
- Basic navigation structure with React Navigation
- Theme system implementation with Context API

### Phase 2: Core Features Implementation (8-10 hours)
- Product catalog screen with API integration
- Product details screen with navigation
- Favorites system with AsyncStorage persistence
- Search functionality with debouncing
- Error handling and loading states

### Phase 3: UI/UX Polish (4-6 hours)
- Theme switching implementation
- Responsive design improvements
- Loading skeletons and animations
- Error boundary implementation
- Accessibility improvements

### Phase 4: Testing & Validation (6-8 hours)
- Unit tests for components and services
- Integration tests for user flows
- Manual testing across different scenarios
- Performance optimization and debugging
- Final validation checklist completion

**Total Estimated Time**: 22-30 hours

## 🐛 Known Issues & Limitations

- Network error handling could be enhanced with retry strategies
- Image caching could be improved with more sophisticated cache management
- Search could benefit from server-side filtering for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
npx expo start --clear
```

**iOS simulator not opening:**
```bash
npx expo run:ios
```

**Android build issues:**
```bash
npx expo run:android --clear
```

**Dependencies issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

For more help, visit the [Expo Documentation](https://docs.expo.dev/) or [React Native Documentation](https://reactnative.dev/docs/getting-started).