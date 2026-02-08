import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: false,
  banner: {
    js: '#!/usr/bin/env node\nimport{createRequire}from"module";const require=createRequire(import.meta.url);',
  },
  external: [
    "react",
    "ink",
    "ink-text-input",
    "yoga-wasm-web",
    "dockerode",
    "simple-git",
  ],
  noExternal: ["chalk", "commander", "yaml", "marked", "marked-terminal"],
});
