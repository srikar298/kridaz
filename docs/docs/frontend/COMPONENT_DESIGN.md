# Component Design

Our UI is built using a component-driven development approach, ensuring a premium and consistent user experience.

## Atomic Design (Modified)

We categorize components into three main types:

### 1. Atoms (Primitives)

Simple, reusable blocks like `Button`, `Input`, `Avatar`, or `Badge`. They do not have any external dependencies.

### 2. Molecules (Compound)

Combinations of atoms that form a functional unit, like a `SearchBar` or a `UserCard`.

### 3. Organisms (Feature Components)

Complex components that handle feature-specific logic, like a `ReelPlayer`, `BookingForm`, or `LiveChat`.

## Styling Patterns

- **Tailwind CSS**: Utility-first styling for speed and responsiveness.
- **Glassmorphism**: Used in overlays and headers for a premium feel.
- **Dynamic Animations**: We use `framer-motion` for smooth transitions and gesture-based interactions.

## Component Standards

- **Props**: Every component must have clear, documented props (TypeScript interfaces).
- **Responsive**: Components must be "Mobile-First" and adapt to desktop layouts.
- **Loading States**: Every component that fetches data must handle its own `Skeleton` or `Spinner` state.
- **Error Boundaries**: Critical organisms should be wrapped in error boundaries to prevent app crashes.

## Best Practices

1. **Avoid Prop Drilling**: Use Redux or Context for deep state sharing.
2. **Composition over Inheritance**: Build complex UIs by nesting components rather than creating massive single files.
3. **Memoization**: Use `React.memo` and `useCallback` for high-frequency components like list items in the Reels feed.
