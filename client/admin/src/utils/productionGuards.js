export const setupProductionGuards = () => {
  // If we are NOT in production, or if explicitly bypassed via env var, skip the guards
  if (
    !import.meta.env.PROD ||
    import.meta.env.VITE_ENABLE_DEVTOOLS === "true"
  ) {
    return;
  }

  // 1. Disable text selection and drag
  const style = document.createElement("style");
  style.innerHTML = `
    * {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    input, textarea {
      -webkit-user-select: auto !important;
      -khtml-user-select: auto !important;
      -moz-user-select: auto !important;
      -ms-user-select: auto !important;
      user-select: auto !important;
    }
  `;
  document.head.appendChild(style);

  // 2. Disable context menu (right-click)
  document.addEventListener("contextmenu", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  });

  // 3. Disable DevTools shortcuts
  document.addEventListener("keydown", (e) => {
    // F12
    if (e.key === "F12") {
      e.preventDefault();
    }
    // Ctrl+Shift+I / Cmd+Opt+I (DevTools)
    if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") ||
      (e.metaKey && e.altKey && e.key.toLowerCase() === "i")
    ) {
      e.preventDefault();
    }
    // Ctrl+Shift+C / Cmd+Opt+C (Inspector)
    if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") ||
      (e.metaKey && e.altKey && e.key.toLowerCase() === "c")
    ) {
      e.preventDefault();
    }
    // Ctrl+Shift+J / Cmd+Opt+J (Console)
    if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "j") ||
      (e.metaKey && e.altKey && e.key.toLowerCase() === "j")
    ) {
      e.preventDefault();
    }
    // Ctrl+U / Cmd+U (View Source)
    if (
      (e.ctrlKey && e.key.toLowerCase() === "u") ||
      (e.metaKey && e.key.toLowerCase() === "u")
    ) {
      e.preventDefault();
    }
  });

  // 4. Disable zooming
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement("meta");
    viewportMeta.name = "viewport";
    document.head.appendChild(viewportMeta);
  }
  viewportMeta.content =
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

  // Prevent pinch-zoom via touch events
  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.scale !== 1 && e.scale !== undefined) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent double-tap to zoom
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    function (e) {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // Prevent wheel zoom (Ctrl + scroll)
  document.addEventListener(
    "wheel",
    function (e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
};
