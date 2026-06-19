import fs from "fs";
import { execSync } from "child_process";

function parseEnv(content) {
  const lines = content.split("\n");
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const name = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      result.push({ name, value, slotSetting: false });
    }
  }
  return result;
}

try {
  // 1. User Frontend
  const userEnvContent = fs.readFileSync(
    "client/user/.env.production",
    "utf-8"
  );
  const userEnv = parseEnv(userEnvContent);
  fs.writeFileSync("user-env.json", JSON.stringify(userEnv, null, 2));
  console.log("Pushing to kridaz-web (User Frontend)...");
  execSync(
    "az webapp config appsettings set -g kridaz-prod -n kridaz-web --settings @user-env.json",
    { stdio: "inherit" }
  );

  // 2. Admin Frontend
  console.log("\nPushing to kridaz-admin (Admin Frontend)...");
  execSync(
    "az webapp config appsettings set -g kridaz-prod -n kridaz-admin --settings @user-env.json",
    { stdio: "inherit" }
  );

  // 3. Backend
  let backendEnvContent = fs.readFileSync("server/.env", "utf-8");
  let backendEnv = parseEnv(backendEnvContent);

  // Apply Overrides
  const overrides = {
    NODE_ENV: "production",
    APP_BASE_URL: "https://api.kridaz.com",
    CLIENT_URLS:
      "https://kridaz.vercel.app,https://www.kridaz.com,https://kridaz-admin.vercel.app",
    OWNER_URL: "https://www.kridaz.com",
    YOUTUBE_REDIRECT_URI: "https://api.kridaz.com/api/youtube/oauth/callback",
  };

  for (const env of backendEnv) {
    if (overrides[env.name]) {
      env.value = overrides[env.name];
    }
  }

  fs.writeFileSync("backend-env.json", JSON.stringify(backendEnv, null, 2));
  console.log("\nPushing to Kridaz (Backend)...");
  execSync(
    "az webapp config appsettings set -g kridaz-prod -n Kridaz --settings @backend-env.json",
    { stdio: "inherit" }
  );

  // Clean up
  fs.unlinkSync("user-env.json");
  fs.unlinkSync("backend-env.json");
  console.log("\nSuccessfully pushed all environment variables to Azure!");
} catch (error) {
  console.error("Error occurred:", error.message);
}
