import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../server/.env") });

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const bucketName = process.env.R2_BUCKET_NAME;

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
      AllowedOrigins: ["http://localhost:5174", "https://kridaz.vercel.app"],
      ExposedHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function setCors() {
  try {
    console.log(`🚀 Setting CORS for bucket: ${bucketName}...`);
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await r2Client.send(command);
    console.log("✅ CORS policy updated successfully!");
    console.log(
      "Origins allowed:",
      corsConfiguration.CORSRules[0].AllowedOrigins.join(", ")
    );
  } catch (err) {
    console.error("❌ Error setting CORS:", err.message);
    if (err.name === "InvalidAccessKeyId") {
      console.error(
        "Tip: Check if your R2_ACCESS_KEY and R2_SECRET_KEY are correct in server/.env"
      );
    }
  }
}

setCors();
