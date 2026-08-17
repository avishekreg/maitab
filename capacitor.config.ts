import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.syncrasystems.maitab",
  appName: "mAITab",
  webDir: "native/www",
  server: {
    url: "https://mai-tab.vercel.app/login",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "mai-tab.vercel.app",
      "mai-tab-zeta.vercel.app",
      "*.vercel.app",
    ],
  },
};

export default config;
