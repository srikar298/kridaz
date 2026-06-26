import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { markRestored } from "./redux/slices/authSlice";
import { HelmetProvider } from "react-helmet-async";
import App from "./app/App";
import { ObservabilityProvider } from "./app/ObservabilityProvider";
import "./index.css";
import * as Sentry from "@sentry/react";
import { setupProductionGuards } from "./utils/productionGuards";

setupProductionGuards();

const isProduction = import.meta.env.PROD;

// Memory leak optimization: strip logs in production unless debugging is explicitly enabled
if (isProduction && import.meta.env.VITE_ENABLE_DEBUG !== "true") {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

Sentry.init({
  dsn:
    import.meta.env.VITE_SENTRY_DSN ||
    "https://634126d8b3183e2da715d594593d1faa@o4511558335660032.ingest.de.sentry.io/4511558345752656",
  integrations: isProduction
    ? [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ]
    : [],
  // Tracing
  tracesSampleRate: isProduction ? 0.1 : 0.0, // Capture 10% in production, 0% in dev
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: isProduction ? ["localhost", /^https:\/\/api\.kridaz\.com\/api/] : [],
  // Session Replay
  replaysSessionSampleRate: isProduction ? 0.1 : 0.0,
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0.0,
  // Enable logs to be sent to Sentry
  enableLogs: isProduction,
  environment: import.meta.env.MODE,
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import { AuthModalProvider } from "./context/AuthModalContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
          onBeforeLift={() => store.dispatch(markRestored())}
        >
          <HelmetProvider>
            <AuthModalProvider>
              <ObservabilityProvider>
                <App />
              </ObservabilityProvider>
            </AuthModalProvider>
          </HelmetProvider>
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
