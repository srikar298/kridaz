export const csrfProtection = (req, res, next) => {
  // Allow safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Get origin and referer headers
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // If neither Origin nor Referer is present, this is a non-browser request
  // (like Postman, curl, or a raw mobile HTTP client).
  // Non-browser clients are not vulnerable to CSRF because they do not
  // automatically attach cookies to cross-domain requests.
  if (!origin && !referer) {
    // If the client relies on cookies (like our web app), the browser would have
    // sent at least one of these headers. So this is safe.
    return next();
  }

  // Determine the origin to validate
  let originToCheck = origin;
  if (!originToCheck && referer) {
    try {
      originToCheck = new URL(referer).origin;
    } catch (e) {
      // Invalid referer URL
      originToCheck = null;
    }
  }

  // Get allowed origins from env or fallback
  const defaultOrigins = [
    "http://localhost:5174",
    "https://kridaz.vercel.app",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
  ];
  
  const allowedOrigins = process.env.CLIENT_URLS
    ? [
        ...process.env.CLIENT_URLS.split(",").map((url) => url.trim()),
        "http://localhost",
        "https://localhost",
        "capacitor://localhost",
      ]
    : defaultOrigins;

  // Validate origin
  if (originToCheck && allowedOrigins.includes(originToCheck)) {
    return next();
  }

  // CSRF attempt detected
  return res.status(403).json({
    success: false,
    message: "CSRF Protection: Cross-origin request denied.",
  });
};
