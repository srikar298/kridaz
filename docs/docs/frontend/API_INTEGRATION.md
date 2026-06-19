# API Integration

The frontend communicates with the backend via a standardized RESTful API and real-time WebSockets.

## RTK Query Hooks

We do not use `fetch()` or `axios` directly in components. Instead, we use generated hooks from our service layer.

```javascript
// In a component
const { data: bookings, isLoading } = useGetBookingsQuery();
```

## Global Configuration

All API calls are routed through a base service that injects:

1. **Base URL**: Set via environment variables.
2. **Auth Header**: Automatically appends the Bearer token if the user is logged in.
3. **Error Handling**: Global interceptors for 401 (refresh token) and 500 errors.

## Real-time Integration (Socket.io)

For features like **Chat** and **Live Scores**, we use WebSockets.

- **Event Listeners**: Managed via custom hooks that mount/unmount listeners with the component lifecycle.
- **Redux Sync**: Socket events often trigger Redux actions to keep the local store updated without a full API refetch.

## Environment Variables

Ensure your local `.env` has the correct API target:

```env
VITE_API_URL=http://localhost:6001/api
VITE_SOCKET_URL=http://localhost:6001
```

## Error Handling

- **User Errors**: 400 errors are displayed via toast notifications (using `react-hot-toast`).
- **Validation Errors**: Field-specific errors are passed to form components (using `react-hook-form`).
