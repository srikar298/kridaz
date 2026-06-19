# API Integration Standards

## 📡 Transport Layer

We use **Axios** as our primary HTTP client due to its robust interceptor support and simplified error handling.

## 🏗 Axios Configuration

Located in `src/services/api.js`.

### Request Interceptor

Automatically attaches the JWT token to every request if available.

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor

Handles global error states, such as 401 Unauthorized (session expiry).

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      // Global logout or refresh token logic
    }
    return Promise.reject(error);
  }
);
```

---

## 🔄 Data Fetching Patterns

### 1. Feature-Based Services

Create separate service files for each domain to keep `api.js` clean.

- `turf.service.js`: `getTurfs()`, `getTurfById()`.
- `booking.service.js`: `createBooking()`, `getBookingHistory()`.

### 2. RTK Query (Modern Standard)

**Preferred for all new features.**

- Use `auto-generated hooks` in components.
- Centralize all API definitions in `src/redux/api/`.

---

## 🛡 Security & Error Handling

### 1. Error Normalization

All API errors should be transformed into a consistent format before reaching the UI:

```javascript
{
  success: false,
  message: "Human-readable error",
  error: "INTERNAL_ERROR_CODE"
}
```

### 2. Environment Management

- **Never hardcode URLs.** Use `import.meta.env.VITE_API_URL`.
- Standardize on `JSON` for all payloads.

## 🚥 Testing API Integration

- Use **Mock Service Worker (MSW)** to intercept and mock API calls during development and testing.
- This ensures tests are decoupled from the actual backend state.
