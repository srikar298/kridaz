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

Sentry.init({
  dsn:
    import.meta.env.VITE_SENTRY_DSN ||
    "https://634126d8b3183e2da715d594593d1faa@o4511558335660032.ingest.de.sentry.io/4511558345752656",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/api\.kridaz\.com\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%.
  replaysOnErrorSampleRate: 1.0, // Change the sample rate to 100% when sampling sessions where errors occur.
  // Enable logs to be sent to Sentry
  enableLogs: true,
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
