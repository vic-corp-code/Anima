import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@anima/i18n", "@anima/ui", "@anima/domain"],
};

export default withNextIntl(nextConfig);
