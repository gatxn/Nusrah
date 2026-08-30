import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's webpack bundling breaks ws's native/fallback frame-masking logic
  // (surfaces as "TypeError: b.mask is not a function" at runtime on hosts
  // where ws's native addon can't load). Leave it to Node's own require.
  serverExternalPackages: ["ws"],
  experimental: {
    // Shared hosting reports a high CPU count but has a much smaller memory
    // allowance; Next's default (cpus - 1) build workers blows past it and
    // the build gets SIGABRT-killed. Force a single worker instead.
    cpus: 1,
  },
};

export default nextConfig;
