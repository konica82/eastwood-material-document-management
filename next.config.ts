import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * googleapis and its transitive deps use Node.js-only APIs (fs, net, tls, …).
   * Declaring them as server-external prevents Turbopack/webpack from attempting
   * to bundle them for the client or SSR renderer — they are resolved at runtime
   * via Node.js require() on the server.
   */
  serverExternalPackages: [
    "googleapis",
    "google-auth-library",
    "gaxios",
    "gcp-metadata",
    "google-logging-utils",
  ],
};

export default nextConfig;
