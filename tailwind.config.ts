import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#C0392B",
          gold: "#F1C40F",
          dark: "#1A1A2E",
        },
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
