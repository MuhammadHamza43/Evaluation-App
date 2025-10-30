# Section 2: Data & API Handling (API Integration)

## Objective
Show how you handle data fetching and state management.

## Tasks Completed ✅

### 1. API Integration with FakeStore API
- ✅ Integrated with `https://fakestoreapi.com/products`
- ✅ Created `ApiService.ts` for centralized API calls
- ✅ Implemented proper error handling and retry logic

### 2. Product List Display on HomeScreen
- ✅ Fetch product list from API
- ✅ Display products in scrollable FlatList
- ✅ Show product title, image, and price
- ✅ Responsive card layout with proper styling

### 3. Loading States
- ✅ Loading spinner while data is fetching
- ✅ Skeleton loading animation for better UX
- ✅ Pull-to-refresh functionality

### 4. Error Handling
- ✅ Network error detection and display
- ✅ Retry mechanism for failed requests
- ✅ User-friendly error messages
- ✅ Graceful degradation when API is unavailable

## Key Implementation Details

### API Service (`src/services/ApiService.ts`)
```typescript
// Centralized API service with error handling
export class ApiService {
  static async fetchProducts(): Promise<Product[]> {
    // Implementation with retry logic and error handling
  }
}
```

### State Management in HomeScreen
```typescript
// Using React hooks for state management
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [refreshing, setRefreshing] = useState(false);
```

### Product Display
- **FlatList** for efficient scrolling of large product lists
- **ProductCard** component for consistent product display
- **Image loading** with fallback for broken images
- **Price formatting** with proper currency display

## Key Files for Section 2

### API Integration
- `src/services/ApiService.ts` - API service with error handling
- `src/types/Product.ts` - Product type definitions
- `src/components/ProductCard.tsx` - Product display component

### State Management
- `src/screens/HomeScreen.tsx` - Main screen with data fetching
- `src/components/LoadingSpinner.tsx` - Loading indicator
- `src/components/ErrorMessage.tsx` - Error display component

## Deliverables ✅
- ✅ Functional API call to FakeStore API
- ✅ Product rendering with title, image, and price
- ✅ Loading indicator during data fetch
- ✅ Error state handling and display
- ✅ Pull-to-refresh functionality

## Evaluation Focus
- ✅ Understanding of asynchronous operations (async/await)
- ✅ State management with useState and useEffect
- ✅ Conditional rendering based on loading/error states
- ✅ Proper error handling and user feedback
- ✅ Efficient list rendering with FlatList

## API Response Example
```json
{
  "id": 1,
  "title": "Fjallraven - Foldsack No. 1 Backpack",
  "price": 109.95,
  "description": "Your perfect pack for everyday use...",
  "category": "men's clothing",
  "image": "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
  "rating": {
    "rate": 3.9,
    "count": 120
  }
}
```