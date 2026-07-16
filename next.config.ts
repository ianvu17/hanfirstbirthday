import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@expo-google-fonts/noto-sans", "pdfkit"]
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
