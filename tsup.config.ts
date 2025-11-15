import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/popup.ts", "src/content.ts", "src/background.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  publicDir: "public",
});
