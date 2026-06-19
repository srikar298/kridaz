# State Management

Kridaz uses a centralized state management system designed to minimize complexity and maximize performance.

## Core Principles

1. **SSOT (Single Source of Truth)**: All global data resides in the Redux store.
2. **Predictable Mutations**: State is updated only via dispatched actions.
3. **Optimistic Updates**: We update the UI immediately for actions like "likes" or "comments" and rollback if the server fails.

## Redux Toolkit (RTK)

We use the official Redux Toolkit to reduce boilerplate.

- **Slices**: Feature-specific state (e.g., `chatSlice`, `authSlice`).
- **Selectors**: Efficiently derived data using `createSelector` to prevent unnecessary re-renders.

## RTK Query (The Powerhouse)

Most of our "state" is actually server data. RTK Query handles:

- **Auto-caching**: Data is cached and shared across components.
- **Polling**: Real-time updates for high-frequency data (like live scores).
- **Invalidation**: Automatically re-fetching data when a mutation occurs (e.g., re-fetching the booking list after a new booking).

## Example: Invalidation Pattern

```javascript
// service.js
export const bookingApi = createApi({
  reducerPath: "bookingApi",
  tagTypes: ["Booking"],
  endpoints: (builder) => ({
    getBookings: builder.query({
      query: () => "/booking/user/list",
      providesTags: ["Booking"],
    }),
    createBooking: builder.mutation({
      query: (body) => ({ url: "/booking/user/create", method: "POST", body }),
      invalidatesTags: ["Booking"], // Trigger auto-refetch of list
    }),
  }),
});
```
