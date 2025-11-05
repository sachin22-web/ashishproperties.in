// vite.config.server.ts
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  // We’re producing node ESM outputs
  build: {
    ssr: true,
    target: "node22",
    outDir: "dist/server",
    emptyOutDir: false, // don’t wipe client build
    minify: false,
    sourcemap: true,

    // 👇 Build BOTH entries
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "server/index.ts"),
        "start-server": path.resolve(__dirname, "server/start-server.ts"),
      },
      external: [
        // Node built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",

        // Server deps to leave out of bundle
        "express",
        "cors",
        "compression",
        "cookie-parser",
        "helmet",
        "morgan",
        "socket.io",

        // Very important: server-only SDKs
        "razorpay",

        // Common heavy libs
        "mongodb",
        "mongoose",
        "nodemailer",
        "firebase-admin",
        "form-data",
        "multer",
        "sharp",
      ],
      output: {
        // two distinct entry files
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "start-server"
            ? "start-server.mjs"
            : "index.mjs";
        },
        format: "es",
        preserveModules: false,
        exports: "named",
      },
      // avoid ESM/CJS interop weirdness
      preserveEntrySignatures: "strict",
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  define: {
    "process.env.NODE_ENV": '"production"',
  },

  // Extra belt-and-suspenders: tell Vite SSR to keep these external
  ssr: {
    external: ["razorpay", "express", "mongoose", "mongodb", "nodemailer"],
    noExternal: [],
  },
});
