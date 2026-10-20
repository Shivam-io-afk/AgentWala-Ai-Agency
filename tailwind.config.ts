import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/content/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1C1F3A",
          dark: "#14172C",
          light: "#252A4A",
        },
        ink: "#1B1F3B",
        amber: {
          DEFAULT: "#FDB91F",
          hover: "#E5A413",
          light: "#FEE28F",
        },
        cream: {
          DEFAULT: "#FBF7EE",
          dark: "#F4EDE0",
        },
        muted: {
          DEFAULT: "#4A4F66",
          light: "#727791",
        },
        border: "#ECE6D8",
        line: "#E2E0EE",
        whatsapp: "#1F7A3A",
        done: "#2E7D5B",
        warn: {
          DEFAULT: "#B4540A",
          bg: "#FDF0E1",
        },
        goodBg: "#E4F3EB",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "sans-serif"],
        sans: ["'Inter'", "'Figtree'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "18px",
      },
      maxWidth: {
        site: "1200px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(28, 31, 58, 0.05)",
        float: "0 8px 30px rgba(28, 31, 58, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
