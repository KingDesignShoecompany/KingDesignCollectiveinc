import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "inc.kingdesigncollective.kdcios",
  appName: "KDCI OS",
  webDir: "out",
  backgroundColor: "#050507",
  server: {
    androidScheme: "https",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050507",
      overlaysWebView: true,
    },
  },
};

export default config;
