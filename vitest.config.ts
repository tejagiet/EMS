import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@ems/types": path.resolve(__dirname, "./packages/types/src/index.ts"),
      "@ems/config": path.resolve(__dirname, "./packages/config/src/index.ts"),
      "@ems/validation": path.resolve(__dirname, "./packages/validation/src/index.ts"),
      "@ems/shared": path.resolve(__dirname, "./packages/shared/src/index.ts"),
      "@ems/feature-registry": path.resolve(__dirname, "./packages/feature-registry/src/index.ts"),
      "@ems/ui": path.resolve(__dirname, "./packages/ui/src/index.ts"),
    },
  },
});
