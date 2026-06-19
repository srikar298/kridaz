import axios from "axios";
import { store } from "@redux/store";
import { logout, restoreAuth } from "@redux/slices/authSlice";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor: attach JWT token from Redux-Persist storage (Optional fallback)
axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: dispatch logout on expired/invalid token, but ignore /getMe failures for guests
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthCheck = originalRequest?.url?.includes("/api/user/auth/getMe");

    // Match on the canonical `code` field (Wave 1 server envelope).
    // The server still emits message === "TOKEN_EXPIRED" as a back-compat
    // shim during the rollout, so we OR the two checks — once that shim is
    // removed, the message branch becomes dead code.
    const errCode = error.response?.data?.code;
    const errMessage = error.response?.data?.message;
    const isExpired =
      errCode === "TOKEN_EXPIRED" || errMessage === "TOKEN_EXPIRED";

    if (
      error.response?.status === 401 &&
      isExpired &&
      !originalRequest._retry &&
      !isAuthCheck
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshUrl = `${import.meta.env.VITE_API_URL || ""}/api/user/auth/refresh`;
        const { data } = await axios.post(
          refreshUrl,
          {},
          { withCredentials: true }
        );

        if (data.token) {
          store.dispatch(restoreAuth({ token: data.token }));
          processQueue(null, data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return axiosInstance(originalRequest);
        } else {
          store.dispatch(logout());
          processQueue(new Error("Refresh failed"));
        }
      } catch (refreshError) {
        store.dispatch(logout());
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      if (!isAuthCheck) {
        console.warn(
          "API returned 401/403. URL:",
          originalRequest?.url,
          "Code:",
          errCode,
          "Message:",
          errMessage
        );
        // Prefer the stable `code` (Wave 1 envelope); fall back to substring
        // matching on the human message for any older response paths that
        // haven't been migrated yet.
        const HARD_LOGOUT_CODES = new Set(["INVALID_TOKEN", "NO_TOKEN"]);
        const msg = errMessage || "";
        const shouldLogout =
          (errCode && HARD_LOGOUT_CODES.has(errCode)) ||
          msg.includes("Invalid token") ||
          msg.includes("Session invalid") ||
          msg.includes("Session expired");
        if (shouldLogout) {
          store.dispatch(logout());
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
