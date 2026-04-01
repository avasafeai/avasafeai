import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["DM Mono", "monospace"],
      },
      colors: {
        navy:     "#0A1628",
        "navy-mid": "#0F2D52",
        "navy-light": "#1A3A6B",
        gold:     "#C9882A",
        "gold-light": "#E4A94A",
        "gold-subtle": "#FDF6EC",
        "off-white": "#FAFAF8",
        surface:  "#F4F4F2",
        border:   "#E8E8E4",
      },
      borderRadius: {
        pill: "100px",
      },
      boxShadow: {
        sm:   "0 1px 3px rgba(10,22,40,0.06), 0 1px 2px rgba(10,22,40,0.04)",
        md:   "0 4px 12px rgba(10,22,40,0.08), 0 2px 4px rgba(10,22,40,0.04)",
        lg:   "0 12px 32px rgba(10,22,40,0.10), 0 4px 8px rgba(10,22,40,0.06)",
        gold: "0 8px 24px rgba(201,136,42,0.20)",
      },
      transitionTimingFunction: {
        entrance: "cubic-bezier(0.16, 1, 0.32, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
