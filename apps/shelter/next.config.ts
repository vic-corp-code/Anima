import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@anima/i18n", "@anima/ui", "@anima/domain"],
  images: {
    // Animal photos are served from Convex file storage — the subdomain
    // differs per deployment (dev vs. prod), hence the wildcard.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.convex.cloud",
        pathname: "/api/storage/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
