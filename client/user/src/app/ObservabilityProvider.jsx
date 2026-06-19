import { useEffect, useRef } from "react";
import { onLCP, onINP, onCLS } from "web-vitals";

const API_BASE = import.meta.env.VITE_API_URL || "";
const VITALS_URL = `${API_BASE}/api/metrics/vitals`;

export function ObservabilityProvider({ children }) {
  const queueRef = useRef({});
  const timeoutRef = useRef(null);

  const flush = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const metricsToSend = Object.values(queueRef.current);
    if (metricsToSend.length === 0) return;

    // Clear queue before sending
    queueRef.current = {};

    const body = JSON.stringify(metricsToSend);

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(VITALS_URL, blob);
      } else {
        fetch(VITALS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to report web vitals:", err);
    }
  };

  const handleMetric = (metric) => {
    // Deduplicate by metric.id, keeping the latest update
    queueRef.current[metric.id] = {
      metricName: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
    };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(flush, 2000);
  };

  useEffect(() => {
    onCLS(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    const handlePageHide = () => {
      flush();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      flush();
    };
  }, []);

  return <>{children}</>;
}
