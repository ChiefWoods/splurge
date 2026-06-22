import { defineConfig } from "oxfmt";

import baseConfig from "../oxfmt.config.ts";

export default defineConfig({
  ...baseConfig,
  ignorePatterns: [
    ".DS_Store",
    "build",
    "dist",
    ".next",
    "node_modules",
    "target",
    "splurge.json",
    "splurge.ts",
    // shadcn components
    "src/components/ui",
    "src/idl",
  ],
});
