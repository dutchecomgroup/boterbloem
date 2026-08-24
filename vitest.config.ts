import { defineConfig } from "vitest/config";
import path from "node:path";

// Aparte config: vite.config.ts heeft `root: client/` (frontend-build) en zou de
// server- en shared-tests daardoor niet vinden.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "shared/**/*.test.ts", "client/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
