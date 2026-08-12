import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      /**
       * `server-only` throws on import unless the resolver picks its
       * `react-server` export, which only Next's bundler does. That is exactly
       * the guard we want in the app and exactly the wrong behaviour here: it
       * makes every module that declares itself server-side untestable,
       * including the store that decides what price the site publishes.
       *
       * Pointed at the package's own `empty.js` - the file its `react-server`
       * condition resolves to - rather than at a stub of ours, so this is the
       * same no-op Next uses on the server rather than a fiction.
       */
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
