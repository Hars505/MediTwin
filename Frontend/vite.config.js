// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Use Vite's native tsconfig paths resolution instead of the separate plugin.
  // The project still depends on `vite-tsconfig-paths` for compatibility, but
  // enabling this option silences the deprecation suggestion from Vite.
  vite: {
    // Override the lightningcss transformer set by @lovable.dev/vite-tanstack-config.
    // LightningCSS doesn't understand Tailwind v4's custom at-rules (@theme, @utility)
    // used by tw-animate-css. The default postcss transformer lets @tailwindcss/vite
    // process those directives first.
    css: { transformer: "postcss" },
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 8080,
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/socket.io": {
          target: "http://localhost:3001",
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },
});
