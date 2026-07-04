import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite is a Node built-in; nothing to bundle. Keep config minimal —
  // this PoC must stay deployable anywhere with `npm run build && npm start`.
};

export default nextConfig;
