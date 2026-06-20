/**
 * Helmet Security Configuration for Kridaz
 * Provides a strict Content Security Policy while allowing essential 3rd party integrations.
 *
 * Note: CSP is disabled in development to prevent blocking local debugging/HMR.
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://checkout.razorpay.com",
        "https://apis.google.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind and dynamic styles
        "https://fonts.googleapis.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://pub-*.r2.dev", // Cloudflare R2 public domains
        "https://lh3.googleusercontent.com",
        "https://*.tile.openstreetmap.org", // Required for Leaflet maps
      ],
      connectSrc: [
        "'self'",
        "wss:",
        "https://api.razorpay.com",
        "https://nominatim.openstreetmap.org",
        "https://countriesnow.space", // Used for location/city data
      ],
      frameSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
        "https://accounts.google.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  // Disable CSP in development to avoid blocking local workflows
  ...(process.env.NODE_ENV === "development" && {
    contentSecurityPolicy: false,
  }),
};

export default helmetConfig;
