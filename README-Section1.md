# Section 1: Project Setup (Environment & Structure)

## Objective
Ensure you can set up a React Native environment and organize your app structure logically.

## Tasks Completed ✅

### 1. Initialize React Native Project with Expo
- ✅ Created new React Native project using Expo
- ✅ Configured `app.json` with proper app metadata
- ✅ Set up `package.json` with required dependencies

### 2. Basic Folder Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API and external services
├── types/          # TypeScript type definitions
├── contexts/       # React Context providers
├── hooks/          # Custom React hooks
└── utils/          # Utility functions
```

### 3. Navigation Setup
- ✅ Installed `@react-navigation/native` and `@react-navigation/native-stack`
- ✅ Created `AppNavigator.tsx` with stack navigation
- ✅ Implemented two screens:
  - **HomeScreen**: Main product listing screen
  - **DetailsScreen**: Product detail view screen

## Key Files for Section 1

### Navigation Structure
- `src/navigation/AppNavigator.tsx` - Main navigation configuration
- `src/screens/HomeScreen.tsx` - Home screen component
- `src/screens/DetailsScreen.tsx` - Details screen component

### Project Configuration
- `app.json` - Expo configuration
- `package.json` - Dependencies and scripts
- `App.tsx` - Root application component

## Running the App
```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
```

## Deliverables ✅
- ✅ Running app with navigation working between Home and Details screens
- ✅ Clean and readable folder structure
- ✅ Proper TypeScript configuration
- ✅ Expo setup with proper configuration

## Evaluation Focus
- ✅ Ability to structure a project
- ✅ Configure navigation properly
- ✅ Organize code in logical folders
- ✅ Set up development environment