import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
const createWebStorage = () => {
  if (typeof window !== "undefined") {
    return {
      getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key, value) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve(value);
      },
      removeItem: (key) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  return {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
};
const storage = createWebStorage();
import rootReducer from "./rootReducers";
import { baseApi } from "./api/baseApi";

const persistConfig = {
  key: "admin-root",
  storage,
  whitelist: ["theme", "auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);
