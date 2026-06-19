import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  "config/firebase-service-account.json";

try {
  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
  if (fs.existsSync(resolvedPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.info("[Firebase Admin] Initialized successfully.");
  } else {
    logger.warn(
      "[Firebase Admin] Service account file not found; push notifications will run in mock mode."
    );
  }
} catch (error) {
  logger.error("[Firebase Admin] Initialization failed:", error);
}

export default admin;
