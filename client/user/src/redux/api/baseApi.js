import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, restoreAuth } from "@redux/slices/authSlice";

// Shared refresh state for RTK Query
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token);
    }
  });
  refreshQueue = [];
};

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    // Get token from auth state
    const state = /** @type {any} */ (getState());
    const token = state.auth?.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // If refresh is in progress, queue this query
  if (isRefreshing) {
    try {
      await new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
      // Retry once the refresh completes
      return await baseQuery(args, api, extraOptions);
    } catch (err) {
      return { error: { status: 401, data: { message: "Session expired" } } };
    }
  }

  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const isRefreshRequest =
      typeof args === "object" &&
      args !== null &&
      args.url?.includes("/api/user/auth/refresh");

    if (isRefreshRequest) {
      return result;
    }

    isRefreshing = true;

    try {
      const refreshResult = await baseQuery(
        {
          url: "/api/user/auth/refresh",
          method: "POST",
          body: {},
        },
        api,
        extraOptions
      );

      if (refreshResult.data && refreshResult.data.token) {
        api.dispatch(restoreAuth({ token: refreshResult.data.token }));
        processQueue(null, refreshResult.data.token);

        // Retry the original query
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
        processQueue(new Error("Refresh failed"));
      }
    } catch (refreshError) {
      api.dispatch(logout());
      processQueue(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: [
    "Chat",
    "Message",
    "User",
    "Team",
    "Games",
    "Reel",
    "Community",
    "Booking",
    "Turf",
    "Stories",
    "Scoring",
    "Tournament",
  ],
});
