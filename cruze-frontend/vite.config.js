import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Enable React Fast Refresh and the automatic JSX runtime
export default defineConfig({
  plugins: [react()],
});
