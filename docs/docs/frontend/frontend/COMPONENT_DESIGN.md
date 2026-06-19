# Component Design System

## 🎨 Design Philosophy

We follow the **Atomic Design** principles adapted for a high-performance React environment. Components should be small, single-purpose, and highly reusable.

## 🏗 Component Hierarchy

### 1. Atoms (`src/components/common`)

The smallest building blocks. They are style-centric and context-agnostic.

- `Button.jsx`, `Badge.jsx`, `Input.jsx`, `Spinner.jsx`.
- **Constraint**: No internal state besides basic UI toggles.

### 2. Molecules (`src/components/features`)

Groups of atoms working together.

- `SearchBar.jsx`, `RatingStars.jsx`, `NavbarLink.jsx`.

### 3. Organisms (`src/components/features/[domain]`)

Complex UI sections that form a distinct part of the interface.

- `TurfCard.jsx`, `BookingModal.jsx`, `AdminSidebar.jsx`.
- **Constraint**: Can interact with Redux or RTK Query hooks.

---

## 🛠 Best Practices

### 1. Functional Components

Always use functional components with standard hooks. No class components.

### 2. Prop Typing

Use `PropTypes` or **TypeScript interfaces** (preferred for new modules) to document component contracts.

### 3. Styled with Tailwind

Avoid inline styles. Use Tailwind CSS classes for all styling to maintain design system consistency.

```jsx
// Good
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all">
  Click Me
</button>
```

### 4. Compound Components

For complex components like Tabs or Modals, use the Compound Component pattern to improve readability.

```jsx
<Tabs>
  <Tabs.List>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="details">...</Tabs.Content>
</Tabs>
```

---

## ♿ Accessibility (a11y)

- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`).
- Ensure all interactive elements have `aria-labels` where icons are used without text.
- Maintain a focus-visible state for keyboard navigation.

## 🧪 Testing Components

- Use **React Testing Library** for behavioral testing.
- Focus on testing user interactions (clicks, input) rather than implementation details.
