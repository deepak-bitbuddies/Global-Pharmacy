import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Disabled on Windows: Turbopack's filesystem cache (RocksDB-backed) hits
    // intermittent file-locking/path errors here ("Persisting failed: Unable
    // to write SST file", "Another write batch or compaction is already
    // active"), corrupting .next/dev and requiring a manual cache wipe.
    turbopackFileSystemCacheForDev: false,
  },
};

export default withNextIntl(nextConfig);
