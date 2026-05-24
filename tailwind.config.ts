import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-sora)", "Sora", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#05070d",
          900: "#0a0f1c",
          850: "#0f172a",
          800: "#111c31",
        },
      },
      boxShadow: {
        glow: "0 0 80px rgba(56, 189, 248, 0.12)",
        cinematic: "0 24px 90px rgba(0, 0, 0, 0.42), 0 0 42px rgba(34, 211, 238, 0.10)",
        lift: "0 22px 70px rgba(0, 0, 0, 0.34), 0 0 30px rgba(34, 211, 238, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
