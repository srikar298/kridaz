# State Management Specification

## 🎯 Philosophy

Kridaz leverages **Redux Toolkit (RTK)** to manage complex global state and **RTK Query** for efficient server-state synchronization. Our goal is to minimize local state prop-drilling and ensure data consistency across the platform.

## 🏗 Redux Toolkit (Client State)

Used for data that doesn't originate from the server or needs to be shared across many disconnected components.

### Core Slices

- **`authSlice.js`**:
  - `user`: The currently logged-in user object.
  - `token`: JWT for API authentication.
  - `isAuthenticated`: Boolean flag.
- **`bookingSlice.js`**:
  - `pendingBooking`: Temporary storage for a booking in progress.
  - `selectedSlot`: The slot currently being viewed.

### Best Practices

1. **Selectors**: Always use `createSelector` for derived data to prevent unnecessary re-renders.
2. **Immutability**: Take advantage of RTK's built-in Immer integration; avoid manual spread operators.

---

## 📡 RTK Query (Server State)

**All API interactions must eventually migrate to RTK Query.**

### Benefits

- **Auto-Caching**: Fetched turfs are cached for 60 seconds (configurable).
- **Invalidation**: Booking a slot automatically invalidates the `turfDetails` cache to reflect the new availability.
- **Hooks**: Auto-generated hooks (e.g., `useGetTurfsQuery`) simplify component logic.

### API Definition Structure

```javascript
// src/services/turfApi.js
export const turfApi = createApi({
  reducerPath: "turfApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Turf"],
  endpoints: (builder) => ({
    getTurfs: builder.query({
      query: () => "turf/all",
      providesTags: ["Turf"],
    }),
  }),
});
```

---

## 🛠 Local State (React Hooks)

Use `useState` and `useReducer` **ONLY** for UI-specific state that isn't needed elsewhere:

- Form input values before submission.
- Dropdown/Modal toggle states.
- Local pagination counters.

## 🚦 Persistence

Sensitive state like `auth` is persisted using `redux-persist` with `localStorage` to ensure sessions survive page refreshes.
