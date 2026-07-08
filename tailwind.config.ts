import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vstep: {
          violet: {
            50: "#f5f3ff",
            100: "#ede9fe",
            500: "#7c3aed",
            600: "#7c3aed",
            700: "#6d28d9",
            900: "#4c1d95",
          },
          emerald: {
            50: "#ecfdf5",
            100: "#d1fae5",
            500: "#10b981",
            600: "#059669",
          },
        },
        error: {
          grammar: {
            text: "#ef4444",
            bg: "rgba(239, 68, 68, 0.08)",
            border: "#ef4444",
          },
          vocabulary: {
            text: "#f97316",
            bg: "rgba(249, 115, 22, 0.08)",
            border: "#f97316",
          },
          spelling: {
            text: "#eab308",
            bg: "rgba(234, 179, 8, 0.08)",
            border: "#eab308",
          },
          cohesion: {
            text: "#3b82f6",
            bg: "rgba(59, 130, 246, 0.08)",
            border: "#3b82f6",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
