import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig({}),
  // OpenNext invokes this command for the underlying Next.js build.
  // Keeping it separate prevents `npm run build` from recursively invoking OpenNext.
  buildCommand: "npm run next:build",
};

export default config;
