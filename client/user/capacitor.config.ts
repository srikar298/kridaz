import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kridaz.app",
  appName: "Kridaz",
  webDir: "dist",
  plugins: {
    extConfig: {},
    CapacitorUpdater: {
      appId: "com.kridaz.app",
      autoUpdate: false,
      defaultChannel: "production",
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      clientId:
        "615790581143-k4g37kb3krcfnh1p64aodd2qa3le5q96.apps.googleusercontent.com",
      serverClientId:
        "615790581143-k4g37kb3krcfnh1p64aodd2qa3le5q96.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
