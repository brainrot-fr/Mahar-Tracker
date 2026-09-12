import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.mahartracker.app",
  appName: "Mahar Tracker",
  webDir: ".vercel/output/static",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
  android: {
    allowMixedContent: true,
  },
};

export default config;
